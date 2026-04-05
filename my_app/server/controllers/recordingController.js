/**
 * controllers/recordingController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * THE CORRECT DATA FLOW (fixes all root causes):
 *
 *   1. Receive multipart file via multer (temp disk file)
 *   2. Upload to Cloudinary  ← async/await, properly handled
 *   3. Create MongoDB doc    ← status: 'processing' (NOT 'completed' yet!)
 *   4. Spawn Python bridge   ← child_process, capture stdout as JSON
 *   5. Parse transcript      ← JSON.parse(stdout)
 *   6. findByIdAndUpdate     ← store transcript, set status: 'completed'
 *   7. Return full doc       ← includes transcript in response
 *
 * If Python fails at step 4-5, the doc is updated to status: 'failed'
 * and the error is persisted so it can be retried later.
 */

const path      = require('path');
const fs        = require('fs');
const { spawn } = require('child_process');

const cloudinary = require('../config/cloudinary');
const Recording  = require('../models/Recording');

// ─── Python bridge config ──────────────────────────────────────────────────
const PYTHON_STT_DIR = path.resolve(
  __dirname,
  '../../../AiModule/SpeechToText'
);
const PYTHON_BRIDGE = path.join(PYTHON_STT_DIR, 'transcribe_bridge.py');

// Use 'python' on Windows, 'python3' on Linux/Mac
const PYTHON_BIN = process.platform === 'win32' ? 'python' : 'python3';

// Max time we'll wait for transcription (5 minutes)
const TRANSCRIPTION_TIMEOUT_MS = 5 * 60 * 1000;

// ─── Helper: run Python bridge ─────────────────────────────────────────────
/**
 * Spawns transcribe_bridge.py and returns its parsed JSON output.
 *
 * Why child_process and not an HTTP API?
 *   For a hackathon setup where Python and Node run on the same machine,
 *   child_process is simplest and avoids spinning up a Flask server.
 *   For production scale, swap this with an HTTP call to a Python microservice.
 *
 * @param {string} filePath  Absolute path to the temp audio file on disk
 * @param {string} model     STT model name  (indicwhisper | indicwav2vec | indicconformer)
 * @param {string} lang      Language code   (hi | bn | ta | te | mr …)
 * @returns {Promise<{transcript:string, duration_ms:number, word_count:number}>}
 */
function runPythonTranscription(filePath, model = 'indicwhisper', lang = 'hi') {
  return new Promise((resolve, reject) => {
    // ── Verify bridge script exists before spawning ──────────────────────
    if (!fs.existsSync(PYTHON_BRIDGE)) {
      return reject(new Error(
        `Python bridge not found at: ${PYTHON_BRIDGE}\n` +
        `Run: copy transcribe_bridge.py to AiModule/SpeechToText/`
      ));
    }

    console.log(`[PY-BRIDGE] Spawning: ${PYTHON_BIN} transcribe_bridge.py`);
    console.log(`[PY-BRIDGE]   file  = ${filePath}`);
    console.log(`[PY-BRIDGE]   model = ${model} | lang = ${lang}`);

    const py = spawn(
      PYTHON_BIN,
      [PYTHON_BRIDGE, filePath, '--model', model, '--lang', lang],
      {
        cwd: PYTHON_STT_DIR,          // so relative imports in bridge work
        env: { ...process.env },      // inherit PATH, CUDA_VISIBLE_DEVICES, etc.
        stdio: ['ignore', 'pipe', 'pipe'], // stdin closed, capture stdout+stderr
      }
    );

    let stdoutBuf = '';
    let stderrBuf = '';

    // Stream stderr live to Node console (Python debug logs appear here)
    py.stderr.on('data', (chunk) => {
      const line = chunk.toString();
      stderrBuf += line;
      process.stderr.write(`[PY] ${line}`);
    });

    // Accumulate stdout — Python writes ONE JSON line at the very end
    py.stdout.on('data', (chunk) => {
      stdoutBuf += chunk.toString();
    });

    // Timeout kill-switch
    const killTimer = setTimeout(() => {
      console.error(`[PY-BRIDGE] TIMEOUT after ${TRANSCRIPTION_TIMEOUT_MS / 1000}s — killing process`);
      py.kill('SIGKILL');
      reject(new Error(
        `Python transcription timed out after ${TRANSCRIPTION_TIMEOUT_MS / 1000}s`
      ));
    }, TRANSCRIPTION_TIMEOUT_MS);

    py.on('close', (code) => {
      clearTimeout(killTimer);
      console.log(`[PY-BRIDGE] Process exited with code ${code}`);

      const rawOut = stdoutBuf.trim();
      console.log(`[PY-BRIDGE] Raw stdout (first 400 chars): ${rawOut.slice(0, 400)}`);

      // ── Guard: empty stdout ──────────────────────────────────────────
      if (!rawOut) {
        return reject(new Error(
          `Python produced no stdout output (exit code ${code}).\n` +
          `stderr: ${stderrBuf.slice(0, 600)}`
        ));
      }

      // ── Parse JSON ───────────────────────────────────────────────────
      let parsed;
      try {
        parsed = JSON.parse(rawOut);
      } catch (parseErr) {
        return reject(new Error(
          `stdout is not valid JSON: ${parseErr.message}\n` +
          `Raw output was: ${rawOut.slice(0, 400)}`
        ));
      }

      // ── Check Python-level ok flag ───────────────────────────────────
      if (!parsed.ok) {
        return reject(new Error(
          `Python returned error: ${parsed.error || 'unknown'}`
        ));
      }

      // ── Success ──────────────────────────────────────────────────────
      resolve({
        transcript:  parsed.transcript,
        duration_ms: parsed.duration_ms,
        word_count:  parsed.word_count,
        model:       parsed.model,
        lang:        parsed.lang,
      });
    });

    py.on('error', (spawnErr) => {
      clearTimeout(killTimer);
      reject(new Error(
        `Failed to spawn Python (is '${PYTHON_BIN}' in PATH?): ${spawnErr.message}`
      ));
    });
  });
}

// ─── Helper: clean up temp file ────────────────────────────────────────────
function cleanupTmp(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.log(`[CLEANUP] Removed temp file: ${filePath}`);
  } catch (e) {
    console.warn(`[CLEANUP] Could not remove temp file: ${e.message}`);
  }
}

// ─── Controller: POST /api/recordings/upload ──────────────────────────────
/**
 * Full pipeline:
 *   multipart file → Cloudinary → MongoDB (processing) → Python → MongoDB (completed)
 */
async function uploadRecording(req, res) {
  const tmpPath = req.file?.path;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!req.file) {
    console.warn('[UPLOAD] No file received');
    return res.status(400).json({ error: 'No audio file received' });
  }
  if (!req.user?._id) {
    cleanupTmp(tmpPath);
    return res.status(401).json({ error: 'Unauthorized: missing user context' });
  }

  const {
    mode       = 'adaptive',
    lang       = 'hi',
    model      = 'indicwhisper',
    recordedAt,
    durationSec,
  } = req.body;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[UPLOAD] ▶ New recording from userId=${req.user._id}`);
  console.log(`[UPLOAD]   filename  : ${req.file.originalname}`);
  console.log(`[UPLOAD]   size      : ${(req.file.size / 1024).toFixed(1)} KB`);
  console.log(`[UPLOAD]   mime      : ${req.file.mimetype}`);
  console.log(`[UPLOAD]   mode      : ${mode} | lang: ${lang} | model: ${model}`);

  let cloudResult = null;
  let dbDoc       = null;

  try {
    // ── STEP 1: Upload to Cloudinary ───────────────────────────────────────
    console.log('[UPLOAD] [1/4] Uploading to Cloudinary...');
    cloudResult = await cloudinary.uploader.upload(tmpPath, {
      resource_type: 'auto',
      folder:        'armor_recordings',
      use_filename:  true,
      unique_filename: true,
    });
    console.log(`[UPLOAD] [1/4] ✔ Cloudinary: ${cloudResult.secure_url}`);

    // ── STEP 2: Save initial MongoDB doc — status=processing ──────────────
    console.log('[UPLOAD] [2/4] Creating MongoDB document (status=processing)...');
    dbDoc = await Recording.create({
      userId:        req.user._id,
      filename:      req.file.originalname,
      cloudUrl:      cloudResult.secure_url,
      cloudPublicId: cloudResult.public_id,
      mimeType:      req.file.mimetype,
      size:          req.file.size,
      duration:      durationSec ? Number(durationSec) : null,
      mode,
      recordedAt:    recordedAt ? new Date(recordedAt) : new Date(),
      status:        'processing',    // IMPORTANT: not 'completed' yet
      transcript:    null,            // IMPORTANT: null until Python finishes
      transcriptLang:  lang,
      transcriptModel: model,
    });
    console.log(`[UPLOAD] [2/4] ✔ MongoDB doc created: _id=${dbDoc._id}`);

    // ── STEP 3: Run Python transcription ───────────────────────────────────
    console.log('[UPLOAD] [3/4] Running Python transcription...');
    const pyResult = await runPythonTranscription(tmpPath, model, lang);
    console.log(`[UPLOAD] [3/4] ✔ Transcript ready:`);
    console.log(`              words      : ${pyResult.word_count}`);
    console.log(`              duration   : ${pyResult.duration_ms}ms`);
    console.log(`              preview    : "${(pyResult.transcript || '').slice(0, 100)}..."`);

    // ── STEP 4: Update MongoDB with transcript ─────────────────────────────
    console.log('[UPLOAD] [4/4] Persisting transcript to MongoDB...');
    const updated = await Recording.findByIdAndUpdate(
      dbDoc._id,
      {
        $set: {
          transcript:      pyResult.transcript,
          transcriptLang:  pyResult.lang,
          transcriptModel: pyResult.model,
          status:          'completed',
          transcriptError: null,
          transcriptedAt:  new Date(),
        },
      },
      { new: true, runValidators: true }
    ).lean();

    // ── Sanity check: make sure the update really wrote the field ──────────
    if (!updated || updated.transcript == null) {
      throw new Error(
        `findByIdAndUpdate ran successfully but transcript is still null for _id=${dbDoc._id}. ` +
        `Check that the 'transcript' field exists in the Mongoose schema.`
      );
    }

    console.log(`[UPLOAD] [4/4] ✔ Transcript persisted! (${updated.transcript.length} chars)`);
    console.log(`[UPLOAD] Pipeline complete for _id=${updated._id}`);
    console.log(`${'─'.repeat(60)}\n`);

    // ── Clean up temp file ─────────────────────────────────────────────────
    cleanupTmp(tmpPath);

    return res.status(201).json({
      ok:              true,
      id:              updated._id,
      filename:        updated.filename,
      cloudUrl:        updated.cloudUrl,
      status:          updated.status,
      transcript:      updated.transcript,
      transcriptLang:  updated.transcriptLang,
      transcriptModel: updated.transcriptModel,
      transcriptedAt:  updated.transcriptedAt,
      size:            updated.size,
      duration:        updated.duration,
      recordedAt:      updated.recordedAt,
    });

  } catch (err) {
    // ── Error handling ─────────────────────────────────────────────────────
    console.error(`[UPLOAD] ✘ PIPELINE ERROR: ${err.message}`);
    console.error(err.stack);

    // Mark the MongoDB doc as failed (if it was created)
    if (dbDoc?._id) {
      try {
        await Recording.findByIdAndUpdate(dbDoc._id, {
          $set: {
            status:          'failed',
            transcriptError: err.message.slice(0, 1000),
          },
        });
        console.log(`[UPLOAD] MongoDB doc ${dbDoc._id} marked as status=failed`);
      } catch (updateErr) {
        console.error(`[UPLOAD] Could not mark doc as failed: ${updateErr.message}`);
      }
    }

    // Delete from Cloudinary if we uploaded but db/python failed
    if (cloudResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(cloudResult.public_id, { resource_type: 'video' });
        console.log(`[UPLOAD] Cloudinary asset deleted: ${cloudResult.public_id}`);
      } catch (cdnErr) {
        console.warn(`[UPLOAD] Could not delete Cloudinary asset: ${cdnErr.message}`);
      }
    }

    cleanupTmp(tmpPath);

    return res.status(500).json({
      error:   'Upload or transcription pipeline failed',
      details: err.message,
      docId:   dbDoc?._id ?? null,   // so client can poll or retry
    });
  }
}

// ─── Controller: GET /api/recordings ──────────────────────────────────────
async function listRecordings(req, res) {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const docs = await Recording.find(filter)
      .sort({ recordedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-__v')
      .lean();

    const total = await Recording.countDocuments(filter);

    res.json({ docs, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[LIST] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Controller: GET /api/recordings/:id ──────────────────────────────────
async function getRecording(req, res) {
  try {
    const doc = await Recording.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    }).lean();

    if (!doc) return res.status(404).json({ error: 'Recording not found' });
    res.json(doc);
  } catch (err) {
    console.error('[GET] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Controller: DELETE /api/recordings/:id ───────────────────────────────
async function deleteRecording(req, res) {
  try {
    const doc = await Recording.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: 'Recording not found' });

    // Remove from Cloudinary
    if (doc.cloudPublicId) {
      await cloudinary.uploader.destroy(doc.cloudPublicId, { resource_type: 'video' });
    }

    await doc.deleteOne();
    res.json({ ok: true, deleted: doc._id });
  } catch (err) {
    console.error('[DELETE] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// ─── Controller: POST /api/recordings/:id/retry-transcription ─────────────
/**
 * Re-runs transcription for a doc that is status=failed.
 * Useful for hackathon demos when the GPU model isn't loaded yet.
 */
async function retryTranscription(req, res) {
  try {
    const doc = await Recording.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });

    if (!doc) return res.status(404).json({ error: 'Recording not found' });
    if (doc.status === 'completed') {
      return res.json({ ok: true, message: 'Already transcribed', transcript: doc.transcript });
    }

    // We need the audio file — re-download from Cloudinary to tmp
    const tmpRetryPath = path.join(__dirname, '../tmp', `retry-${doc._id}.webm`);
    const { default: https } = await import('https');
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tmpRetryPath);
      https.get(doc.cloudUrl, (resp) => resp.pipe(file));
      file.on('finish', resolve);
      file.on('error', reject);
    });

    await Recording.findByIdAndUpdate(doc._id, { $set: { status: 'processing', transcriptError: null } });

    const pyResult = await runPythonTranscription(
      tmpRetryPath,
      doc.transcriptModel || 'indicwhisper',
      doc.transcriptLang  || 'hi'
    );

    const updated = await Recording.findByIdAndUpdate(
      doc._id,
      { $set: {
        transcript:      pyResult.transcript,
        status:          'completed',
        transcriptError: null,
        transcriptedAt:  new Date(),
      }},
      { new: true }
    ).lean();

    cleanupTmp(tmpRetryPath);

    res.json({ ok: true, transcript: updated.transcript, status: updated.status });
  } catch (err) {
    console.error('[RETRY] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  uploadRecording,
  listRecordings,
  getRecording,
  deleteRecording,
  retryTranscription,
};
