const axios = require('axios');
const FormData = require('form-data');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Transcript = require('../models/Transcript');
const ApiError = require('../utils/ApiError');

// â”€â”€ External transcript engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Parses Python API response into our schema
 */
const _parseTranscriptResponse = (parsed) => {
  // Build the insights object from the 15-key pipeline output if present
  const insightsKeys = [
    'finance_detected','source_language','original_text','english_text',
    'sentiment_label','sentiment_score','intent','domain','summary',
    'emotion','urgency','risk_level','amount','entities','keywords',
  ];
  const hasInsights = insightsKeys.some(k => k in parsed);
  const insights = hasInsights ? Object.fromEntries(insightsKeys.map(k => [k, parsed[k] ?? null])) : null;

  return {
    text:     parsed.original_transcript || parsed.english_text || '',
    language: parsed.detected_language   || parsed.source_language || 'hi',
    confidence: parsed.stt_confidence ?? null,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 20) : [],
    summary:  parsed.summary || '',
    insights,
  };
};

/**
 * Dual Integration: generates transcript either via API or Child Process.
 */
const createPendingTranscript = async (userId, recordingId) => {
  const transcript = new Transcript({
    userId,
    recordingId,
    status: 'pending',
  });
  return await transcript.save();
};

/**
 * Executes STT processing and fully updates the Transcript DB object.
 */
const processTranscript = async (userId, recordingId, cloudUrl, buffer, originalname) => {
  const useChildProcess = process.env.USE_CHILD_PROCESS === 'true';
  let transcriptData;

  try {
    // 1. Mark as processing
    await Transcript.findOneAndUpdate({ recordingId }, { status: 'processing' });

    if (!buffer) throw new Error("Audio buffer is required for reliable transcription");

    // 2. Transcribe via preferred integration
    if (useChildProcess) {
      transcriptData = await generateTranscriptViaChildProcess(buffer, originalname);
    } else {
      transcriptData = await generateTranscriptViaAPI(buffer, originalname);
    }

    // 3. Mark as complete
    await Transcript.findOneAndUpdate(
      { recordingId },
      { ...transcriptData, status: 'done', errorMessage: '' }
    );
  } catch (err) {
    // Mark as failed
    await Transcript.findOneAndUpdate(
      { recordingId },
      { status: 'failed', errorMessage: err.message }
    );
    throw err;
  }
};

const http = require('http');
const https = require('https');

/**
 * 1. API Integration Method
 */
const generateTranscriptViaAPI = async (buffer, originalname) => {
  const engineUrl = process.env.TRANSCRIPT_ENGINE_URL;
  const apiKey = process.env.TRANSCRIPT_ENGINE_API_KEY;

  if (!engineUrl) throw new Error('TRANSCRIPT_ENGINE_URL is not configured');

  try {
    const form = new FormData();
    // Python FastAPI explicitly rejects .webm filenames. Bypassing by renaming string to .mp3
    form.append('file', buffer, 'recording.mp3');
    form.append('language', 'hi'); // hardcoded based on teammate's original code

    // TCP Keep-Alive prevents ECONNRESET during the long STT engine processing wait
    const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 10000 });
    const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 10000 });

    const postConfig = {
      headers: { ...form.getHeaders(), 'Connection': 'keep-alive' },
      timeout: 180_000,               // 3 full minutes max
      maxBodyLength: Infinity,        // Prevent chunk cutoffs
      maxContentLength: Infinity,
      httpAgent,
      httpsAgent
    };

    if (apiKey) postConfig.headers['x-api-key'] = apiKey;

    const response = await axios.post(engineUrl, form, postConfig);
    return _parseTranscriptResponse(response.data);
  } catch (err) {
    if (err.response) {
      let msg = err.response.data;
      if (typeof msg === 'object') msg = JSON.stringify(msg);
      throw new Error(`Transcript engine error ${err.response.status}: ${msg}`);
    } else {
      throw new Error(`Transcript engine request failed: ${err.message}`);
    }
  }
};

/**
 * 2. Child Process Integration Method
 */
const generateTranscriptViaChildProcess = (audioBuffer, originalname) => {
  return new Promise((resolve, reject) => {
    // Write buffer to a temp file
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${Date.now()}_${originalname}`);
    
    fs.writeFileSync(tempFilePath, audioBuffer);

    // Assume python script is located relative to project root or set via env
    const scriptPath = process.env.PYTHON_SCRIPT_PATH || path.join(__dirname, '../../../python_engine/transcribe.py');
    const pythonExecutable = process.env.PYTHON_EXEC || 'python3';

    // Call python script. We expect it to print JSON to stdout.
    const pythonProcess = spawn(pythonExecutable, [scriptPath, tempFilePath, '--language', 'hi']);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { stderrData += data.toString(); });

    pythonProcess.on('close', (code) => {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}. Stderr: ${stderrData}`));
      }

      try {
        // Try parsing JSON output
        const match = stdoutData.match(/\{.*\}/s); 
        const jsonStr = match ? match[0] : stdoutData;
        const parsed = JSON.parse(jsonStr);
        resolve(_parseTranscriptResponse(parsed));
      } catch (err) {
        reject(new Error(`Failed to parse python response: ${stdoutData}. Error: ${err.message}`));
      }
    });
  });
};

// â”€â”€ DB Queries (Mapped strictly to Transcript Model) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const getUserTranscripts = async (userId, { page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [transcripts, total] = await Promise.all([
    Transcript.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Transcript.countDocuments({ userId }),
  ]);

  return { transcripts, total, page: pageNum, limit: limitNum };
};

const getTranscriptById = async (id, userId, role) => {
  const query = role === 'admin' ? { _id: id } : { _id: id, userId };
  const transcript = await Transcript.findOne(query).lean();
  if (!transcript) throw ApiError.notFound('Transcript not found');
  return transcript;
};

const getRecordingTranscript = async (recordingId) => {
  const transcript = await Transcript.findOne({ recordingId }).lean();
  return transcript;
};

const searchTranscripts = async (userId, keyword) => {
  if (!keyword || !keyword.trim()) throw ApiError.badRequest('Search keyword is required');

  const transcripts = await Transcript.find({
    userId,
    status: 'done',
    text: { $regex: keyword.trim(), $options: 'i' },
  })
    .limit(50)
    .lean();

  return transcripts;
};

const deleteTranscriptByRecordingId = async (recordingId) => {
  return await Transcript.findOneAndDelete({ recordingId });
};

const deleteTranscript = async (id, userId) => {
  const transcript = await Transcript.findOneAndDelete({ _id: id, userId }).lean();
  if (!transcript) throw ApiError.notFound('Transcript not found');
  return transcript;
};

/**
 * Aggregate insights across all done transcripts for a user.
 * Returns daily sentiment, risk distribution, domain breakdown, urgency counts, top keywords.
 */
const getInsightsSummary = async (userId) => {
  const transcripts = await Transcript.find({ userId, status: 'done' })
    .sort({ createdAt: 1 })
    .lean();

  const sentimentByDay = {};
  const riskCounts     = { low: 0, medium: 0, high: 0 };
  const domainCounts   = {};
  const urgencyCounts  = { low: 0, medium: 0, high: 0 };
  const emotionCounts  = {};
  const intentCounts   = {};
  const keywordFreq    = {};
  let financeCount     = 0;
  let totalWithInsights = 0;

  for (const t of transcripts) {
    const ins = t.insights;
    const day = (t.createdAt || new Date()).toISOString().slice(0, 10);

    // Aggregate keywords from transcript.keywords (always present)
    for (const kw of (t.keywords || [])) {
      const k = kw.toLowerCase().trim();
      if (k) keywordFreq[k] = (keywordFreq[k] || 0) + 1;
    }

    if (!ins) continue;
    totalWithInsights++;

    if (ins.finance_detected) financeCount++;

    // Sentiment by day
    if (!sentimentByDay[day]) sentimentByDay[day] = { positive: 0, negative: 0, neutral: 0, total: 0 };
    const sl = (ins.sentiment_label || 'neutral').toLowerCase();
    sentimentByDay[day][sl] = (sentimentByDay[day][sl] || 0) + 1;
    sentimentByDay[day].total++;

    // Risk
    const rl = (ins.risk_level || 'low').toLowerCase();
    if (rl === 'high')        riskCounts.high++;
    else if (rl === 'medium' || rl === 'med') riskCounts.medium++;
    else                      riskCounts.low++;

    // Domain
    const dom = ins.domain || 'general';
    domainCounts[dom] = (domainCounts[dom] || 0) + 1;

    // Urgency
    const urg = (ins.urgency || 'low').toLowerCase();
    if (urg === 'high')        urgencyCounts.high++;
    else if (urg === 'medium' || urg === 'med') urgencyCounts.medium++;
    else                       urgencyCounts.low++;

    // Emotion
    const em = ins.emotion || 'neutral';
    emotionCounts[em] = (emotionCounts[em] || 0) + 1;

    // Intent
    const intent = ins.intent || 'unknown';
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  }

  // Build sorted daily sentiment array
  const sentimentTimeline = Object.entries(sentimentByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Top 15 keywords
  const topKeywords = Object.entries(keywordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  // Domain pie data
  const domainData = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Emotion data
  const emotionData = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Intent data
  const intentData = Object.entries(intentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  return {
    totalTranscripts:   transcripts.length,
    totalWithInsights,
    financeCount,
    riskCounts,
    urgencyCounts,
    sentimentTimeline,
    topKeywords,
    domainData,
    emotionData,
    intentData,
  };
};

module.exports = {
  createPendingTranscript,
  processTranscript,
  getUserTranscripts,
  getTranscriptById,
  getRecordingTranscript,
  searchTranscripts,
  deleteTranscript,
  deleteTranscriptByRecordingId,
  getInsightsSummary,
};
