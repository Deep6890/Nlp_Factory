const fs         = require('fs');
const axios      = require('axios');
const cloudinary = require('../config/cloudinary');
const Recording  = require('../models/Recording');

const ENGINE_URL     = process.env.TRANSCRIPT_ENGINE_URL;
const ENGINE_API_KEY = process.env.TRANSCRIPT_ENGINE_API_KEY;
const ENGINE_TIMEOUT = 5 * 60 * 1000; // 5 min

// ── Call transcript engine ────────────────────────────────────────────────────
async function callTranscriptEngine(audioUrl, lang = 'hi', model = 'indicwhisper') {
  if (!ENGINE_URL) throw new Error('TRANSCRIPT_ENGINE_URL not set in .env');

  const { data } = await axios.post(
    ENGINE_URL,
    { audio_url: audioUrl, lang, model },
    {
      timeout: ENGINE_TIMEOUT,
      headers: {
        'Content-Type':  'application/json',
        'X-API-Key':     ENGINE_API_KEY || '',
      },
    }
  );

  // Engine must return: { text, language, confidence, keywords, summary }
  if (!data || !data.text) throw new Error('Transcript engine returned no text');
  return data;
}

// ── Cleanup tmp file ──────────────────────────────────────────────────────────
function cleanupTmp(p) {
  if (!p) return;
  try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
}

// ── POST /api/recordings/upload ───────────────────────────────────────────────
async function uploadRecording(req, res) {
  const tmpPath = req.file?.path;

  if (!req.file)      return res.status(400).json({ error: 'No audio file received' });
  if (!req.user?._id) { cleanupTmp(tmpPath); return res.status(401).json({ error: 'Unauthorized' }); }

  const { mode = 'adaptive', lang = 'hi', model = 'indicwhisper', recordedAt, durationSec } = req.body;

  console.log(`\n[UPLOAD] userId=${req.user._id} file=${req.file.originalname} size=${(req.file.size/1024).toFixed(1)}KB`);

  let cloudResult = null;
  let dbDoc       = null;

  try {
    // 1. Upload to Cloudinary
    cloudResult = await cloudinary.uploader.upload(tmpPath, {
      resource_type: 'auto', folder: 'armor_recordings',
      use_filename: true, unique_filename: true,
    });
    console.log(`[UPLOAD] Cloudinary ✔ ${cloudResult.secure_url}`);

    // 2. Create DB doc (processing)
    dbDoc = await Recording.create({
      userId: req.user._id, filename: req.file.originalname,
      cloudUrl: cloudResult.secure_url, cloudPublicId: cloudResult.public_id,
      mimeType: req.file.mimetype, size: req.file.size,
      duration: durationSec ? Number(durationSec) : null,
      mode, recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      status: 'processing', transcriptLang: lang, transcriptModel: model,
    });
    console.log(`[UPLOAD] DB doc ✔ _id=${dbDoc._id}`);

    // 3. Call transcript engine with Cloudinary URL
    console.log(`[UPLOAD] Calling transcript engine...`);
    const result = await callTranscriptEngine(cloudResult.secure_url, lang, model);
    console.log(`[UPLOAD] Transcript ✔ "${(result.text || '').slice(0, 80)}..."`);

    // 4. Persist transcript
    const updated = await Recording.findByIdAndUpdate(dbDoc._id, {
      $set: {
        transcript:      result.text,
        transcriptLang:  result.language || lang,
        transcriptModel: model,
        confidence:      result.confidence,
        keywords:        result.keywords,
        summary:         result.summary,
        status:          'completed',
        transcriptError: null,
        transcriptedAt:  new Date(),
      },
    }, { new: true }).lean();

    cleanupTmp(tmpPath);

    return res.status(201).json({
      success: true,
      data: {
        id:              updated._id,
        filename:        updated.filename,
        cloudUrl:        updated.cloudUrl,
        status:          updated.status,
        transcript:      updated.transcript,
        transcriptLang:  updated.transcriptLang,
        confidence:      updated.confidence,
        keywords:        updated.keywords,
        summary:         updated.summary,
        transcriptedAt:  updated.transcriptedAt,
        size:            updated.size,
        duration:        updated.duration,
        recordedAt:      updated.recordedAt,
      },
    });

  } catch (err) {
    console.error(`[UPLOAD] ERROR: ${err.message}`);

    if (dbDoc?._id) {
      await Recording.findByIdAndUpdate(dbDoc._id, {
        $set: { status: 'failed', transcriptError: err.message.slice(0, 1000) },
      }).catch(() => {});
    }
    if (cloudResult?.public_id) {
      await cloudinary.uploader.destroy(cloudResult.public_id, { resource_type: 'video' }).catch(() => {});
    }
    cleanupTmp(tmpPath);

    return res.status(500).json({ error: 'Pipeline failed', details: err.message, docId: dbDoc?._id ?? null });
  }
}

// ── GET /api/recordings ───────────────────────────────────────────────────────
async function listRecordings(req, res) {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const [docs, total] = await Promise.all([
      Recording.find(filter).sort({ recordedAt: -1 })
        .limit(Number(limit)).skip((Number(page) - 1) * Number(limit))
        .select('-__v').lean(),
      Recording.countDocuments(filter),
    ]);

    res.json({ success: true, data: { docs, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── GET /api/recordings/:id ───────────────────────────────────────────────────
async function getRecording(req, res) {
  try {
    const doc = await Recording.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── DELETE /api/recordings/:id ────────────────────────────────────────────────
async function deleteRecording(req, res) {
  try {
    const doc = await Recording.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.cloudPublicId)
      await cloudinary.uploader.destroy(doc.cloudPublicId, { resource_type: 'video' }).catch(() => {});
    await doc.deleteOne();
    res.json({ success: true, data: { deleted: doc._id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ── POST /api/recordings/:id/retry ───────────────────────────────────────────
async function retryTranscription(req, res) {
  try {
    const doc = await Recording.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.status === 'completed')
      return res.json({ success: true, data: { message: 'Already transcribed', transcript: doc.transcript } });

    await Recording.findByIdAndUpdate(doc._id, { $set: { status: 'processing', transcriptError: null } });

    const result = await callTranscriptEngine(doc.cloudUrl, doc.transcriptLang || 'hi', doc.transcriptModel || 'indicwhisper');

    const updated = await Recording.findByIdAndUpdate(doc._id, {
      $set: {
        transcript: result.text, transcriptLang: result.language || doc.transcriptLang,
        confidence: result.confidence, keywords: result.keywords, summary: result.summary,
        status: 'completed', transcriptError: null, transcriptedAt: new Date(),
      },
    }, { new: true }).lean();

    res.json({ success: true, data: { transcript: updated.transcript, status: updated.status } });
  } catch (err) {
    await Recording.findByIdAndUpdate(req.params.id, {
      $set: { status: 'failed', transcriptError: err.message.slice(0, 1000) },
    }).catch(() => {});
    res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadRecording, listRecordings, getRecording, deleteRecording, retryTranscription };
