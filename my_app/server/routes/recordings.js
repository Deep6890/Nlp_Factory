/**
 * routes/recordings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All /api/recordings endpoints.
 *
 * POST   /api/recordings/upload          — upload + transcribe
 * GET    /api/recordings                 — list user recordings
 * GET    /api/recordings/:id             — single recording (includes transcript)
 * DELETE /api/recordings/:id             — delete recording + Cloudinary asset
 * POST   /api/recordings/:id/retry       — retry transcription for failed docs
 */

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const auth = require('../middleware/auth');
const {
  uploadRecording,
  listRecordings,
  getRecording,
  deleteRecording,
  retryTranscription,
} = require('../controllers/recordingController');

const router = express.Router();

// ── Multer: disk storage (Python needs a real file path) ──────────────────
const TMP_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, TMP_DIR),
  filename:    (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const ALLOWED_MIME = new Set([
  'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav',
  'audio/ogg',  'audio/flac', 'audio/x-m4a', 'audio/aac',
  'video/webm', // some browsers send webm as video/webm
]);

const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150 MB
  fileFilter: (_, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error(
      `Unsupported MIME type: "${file.mimetype}". ` +
      `Supported: ${[...ALLOWED_MIME].join(', ')}`
    ));
  },
});

// ── Multer error handler ──────────────────────────────────────────────────
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large (max 150 MB)' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

// ── Routes ────────────────────────────────────────────────────────────────
router.post(
  '/upload',
  auth,
  (req, res, next) => upload.single('file')(req, res, (err) => handleMulterError(err, req, res, next)),
  uploadRecording
);

router.get('/',    auth, listRecordings);
router.get('/:id', auth, getRecording);
router.delete('/:id', auth, deleteRecording);
router.post('/:id/retry', auth, retryTranscription);

module.exports = router;
