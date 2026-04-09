const supabase  = require('../config/supabase');
const ApiError  = require('../utils/ApiError');
const { spawn } = require('child_process');
const path      = require('path');

// ── Parse AI pipeline response — store full JSON in insights ─────────────────
const _parseTranscriptResponse = (parsed) => {
  const lang = parsed.detected_language;
  return {
    text:       parsed.original_transcript || '',
    // only store real language codes, not 'unknown'
    language:   (lang && lang !== 'unknown') ? lang : null,
    confidence: parsed.stt_confidence      ?? null,
    keywords:   Array.isArray(parsed.keywords) ? parsed.keywords : [],
    summary:    parsed.summary             || '',
    insights:   parsed,   // full 25-key JSON stored as-is
  };
};

// ── Create pending transcript row ─────────────────────────────────────────────
const createPendingTranscript = async (userId, recordingId) => {
  const { data, error } = await supabase
    .from('transcripts')
    .insert({ user_id: userId, recording_id: recordingId, status: 'pending' })
    .select()
    .single();
  if (error) throw ApiError.internal(error.message);
  return _mapTranscript(data);
};

// ── Process transcript via AI module ─────────────────────────────────────────
// mode: 'fast' = Sarvam (1/day limit), 'slow' = local whisper (no limit)
const processTranscript = async (userId, recordingId, storageUrl, mode = 'slow', language = null) => {
  try {
    const { error: procErr } = await supabase
      .from('transcripts')
      .update({ status: 'processing' })
      .eq('recording_id', recordingId);
    if (procErr) console.error('[AI] Failed to set processing status:', procErr.message);

    if (!storageUrl) throw new Error('Storage URL is required');

    // Enforce fast pipeline daily limit
    if (mode === 'fast') {
      const canUse = await _checkFastLimit(userId);
      if (!canUse) {
        throw new Error('FAST_LIMIT_EXCEEDED: Fast transcription limit reached for today (1/day). Use slow mode.');
      }
    }

    console.log(`[AI] Mode=${mode} | Lang=${language || 'auto'} | Recording=${recordingId}`);
    const transcriptData = await _callAiModule(storageUrl, mode, language);

    const { error: updateErr } = await supabase
      .from('transcripts')
      .update({
        text:          transcriptData.text,
        language:      transcriptData.language,
        confidence:    transcriptData.confidence,
        keywords:      transcriptData.keywords,
        summary:       transcriptData.summary,
        insights:      transcriptData.insights,
        status:        'done',
        error_message: null,
      })
      .eq('recording_id', recordingId);

    if (updateErr) {
      console.error('[AI] ❌ Supabase update failed:', updateErr.message, updateErr.details);
      throw new Error(`DB update failed: ${updateErr.message}`);
    }
    console.log(`[AI] ✅ Transcript saved to DB — recording=${recordingId}`);
  } catch (err) {
    console.error('[AI] Pipeline error:', err.message);
    const { error: failErr } = await supabase
      .from('transcripts')
      .update({ status: 'failed', error_message: err.message })
      .eq('recording_id', recordingId);
    if (failErr) console.error('[AI] Failed to set failed status:', failErr.message);
    throw err;
  }
};

// ── Daily fast-pipeline limit (1 per user per day) ───────────────────────────
const _checkFastLimit = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('transcripts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('insights->>mode', 'fast')
    .gte('created_at', `${today}T00:00:00Z`);
  return (count || 0) === 0;
};

const _callAiModule = (storageUrl, mode = 'slow', language = null) => {
  return new Promise((resolve, reject) => {
    // Always use process_audio.py — it handles both fast (Sarvam) and slow (Whisper)
    // and runs the full insights pipeline regardless of STT mode
    const scriptPath = path.resolve(__dirname, '../../../AiModule/process_audio.py');
    const pythonExec = process.env.PYTHON_EXEC
      || path.resolve(__dirname, '../../../AiModule/venv/Scripts/python.exe');

    // Build args: source [language] --mode fast|slow
    const args = [scriptPath, storageUrl];
    if (language) args.push(language);
    args.push('--mode', mode);   // always explicit

    console.log(`[AI] script=process_audio.py  mode=${mode}  lang=${language || 'auto'}`);

    const child = spawn(pythonExec, args, {
      timeout: 300_000,
      env: {
        ...process.env,
        PYTHONIOENCODING:    'utf-8',
        PYTHONUTF8:          '1',
        CUDA_VISIBLE_DEVICES: '0',   // CUDA device 0 = RTX 3050 (Intel UHD invisible to CUDA)
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => {
      stderr += d.toString();
      // Stream AI logs to backend console so you can see progress
      process.stdout.write('[AI] ' + d.toString());
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`AI pipeline exited ${code}: ${stderr.slice(-400)}`));
      }

      // Extract JSON — find first { to its matching last }
      const firstBrace = stdout.indexOf('{');
      const lastBrace  = stdout.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        return reject(new Error(`No JSON in AI output. stdout: ${stdout.slice(-300)}`));
      }

      const jsonStr = stdout.slice(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.error) return reject(new Error(parsed.error));
        console.log('\n[AI] ✅ Pipeline complete:');
        console.log(JSON.stringify(parsed, null, 2));
        resolve(_parseTranscriptResponse(parsed));
      } catch (e) {
        reject(new Error(`JSON parse failed: ${e.message}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn AI process: ${err.message}`));
    });
  });
};

// ── CRUD ──────────────────────────────────────────────────────────────────────
const getUserTranscripts = async (userId, { page = 1, limit = 20 } = {}) => {
  const pageNum  = Math.max(1, Number(page)  || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const from     = (pageNum - 1) * limitNum;
  const to       = from + limitNum - 1;

  const { data, error, count } = await supabase
    .from('transcripts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw ApiError.internal(error.message);
  return { transcripts: (data || []).map(_mapTranscript), total: count || 0, page: pageNum, limit: limitNum };
};

const getTranscriptById = async (id, userId, role) => {
  let query = supabase.from('transcripts').select('*').eq('id', id);
  if (role !== 'admin') query = query.eq('user_id', userId);
  const { data, error } = await query.single();
  if (error || !data) throw ApiError.notFound('Transcript not found');
  return _mapTranscript(data);
};

const getRecordingTranscript = async (recordingId) => {
  const { data } = await supabase
    .from('transcripts')
    .select('*')
    .eq('recording_id', recordingId)
    .single();
  return data ? _mapTranscript(data) : null;
};

const searchTranscripts = async (userId, keyword) => {
  if (!keyword?.trim()) throw ApiError.badRequest('Search keyword is required');
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'done')
    .ilike('text', `%${keyword.trim()}%`)
    .limit(50);
  if (error) throw ApiError.internal(error.message);
  return (data || []).map(_mapTranscript);
};

const deleteTranscriptByRecordingId = async (recordingId) => {
  await supabase.from('transcripts').delete().eq('recording_id', recordingId);
};

const deleteTranscript = async (id, userId) => {
  const { data, error } = await supabase
    .from('transcripts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error || !data) throw ApiError.notFound('Transcript not found');
  return _mapTranscript(data);
};

// ── Update insights JSON (for the editor page) ────────────────────────────────
const updateInsights = async (id, userId, insights) => {
  const { data, error } = await supabase
    .from('transcripts')
    .update({ insights })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error || !data) throw ApiError.notFound('Transcript not found');
  return _mapTranscript(data);
};

// ── Aggregated insights summary ───────────────────────────────────────────────
const getInsightsSummary = async (userId) => {
  const { data: transcripts } = await supabase
    .from('transcripts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'done')
    .order('created_at', { ascending: true });

  const rows = (transcripts || []).map(_mapTranscript);

  const sentimentByDay = {};
  const riskCounts     = { low: 0, medium: 0, high: 0 };
  const domainCounts   = {};
  const urgencyCounts  = { low: 0, medium: 0, high: 0 };
  const emotionCounts  = {};
  const intentCounts   = {};
  const keywordFreq    = {};
  let financeCount     = 0;
  let totalWithInsights = 0;

  for (const t of rows) {
    const ins = t.insights;
    const day = (t.createdAt || new Date()).slice(0, 10);

    for (const kw of (t.keywords || [])) {
      const k = kw.toLowerCase().trim();
      if (k) keywordFreq[k] = (keywordFreq[k] || 0) + 1;
    }

    if (!ins) continue;
    totalWithInsights++;

    if (ins.finance_detected) financeCount++;

    if (!sentimentByDay[day]) sentimentByDay[day] = { positive: 0, negative: 0, neutral: 0, total: 0 };
    const sl = (ins.sentiment_label || 'neutral').toLowerCase();
    sentimentByDay[day][sl] = (sentimentByDay[day][sl] || 0) + 1;
    sentimentByDay[day].total++;

    const rl = (ins.risk_level || 'low').toLowerCase();
    if (rl === 'high') riskCounts.high++;
    else if (rl === 'medium' || rl === 'med') riskCounts.medium++;
    else riskCounts.low++;

    const dom = ins.domain || 'general';
    domainCounts[dom] = (domainCounts[dom] || 0) + 1;

    const urg = (ins.urgency || 'low').toLowerCase();
    if (urg === 'high') urgencyCounts.high++;
    else if (urg === 'medium' || urg === 'med') urgencyCounts.medium++;
    else urgencyCounts.low++;

    const em = ins.emotion || 'neutral';
    emotionCounts[em] = (emotionCounts[em] || 0) + 1;

    const intent = ins.intent || 'unknown';
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  }

  const sentimentTimeline = Object.entries(sentimentByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const topKeywords = Object.entries(keywordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  const domainData = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const emotionData = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const intentData = Object.entries(intentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  return {
    totalTranscripts: rows.length,
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

// ── Map DB row → API shape ────────────────────────────────────────────────────
const _mapTranscript = (r) => ({
  _id:          r.id,
  userId:       r.user_id,
  recordingId:  r.recording_id,
  text:         r.text         || '',
  language:     (r.status === 'done') ? (r.language || null) : null,
  confidence:   r.confidence,
  keywords:     r.keywords     || [],
  summary:      r.summary      || '',
  insights:     r.insights     || null,
  status:       r.status,
  pipeline_mode: r.insights?.mode || null,   // read from insights JSON
  errorMessage: r.error_message,
  createdAt:    r.created_at,
  updatedAt:    r.updated_at,
});

// ── Fast limit status (for frontend to show remaining uses) ──────────────────
const getFastLimitStatus = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('transcripts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('insights->>mode', 'fast')
    .gte('created_at', `${today}T00:00:00Z`);
  const used = count || 0;
  return { used, limit: 1, remaining: Math.max(0, 1 - used), canUse: used === 0 };
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
  updateInsights,
  getInsightsSummary,
  getFastLimitStatus,
};
