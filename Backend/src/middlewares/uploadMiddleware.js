const multer   = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only audio files are accepted'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

/**
 * Single audio field named "audio".
 * Usage: router.post('/upload', uploadAudio, controller)
 */
const uploadAudio = upload.single('audio');

module.exports = { uploadAudio };
