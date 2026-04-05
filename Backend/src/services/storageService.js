const cloudinary   = require('../config/cloudinary');
const ApiError     = require('../utils/ApiError');
const { Readable } = require('stream');
const crypto       = require('crypto');

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Generate a unique Cloudinary public_id scoped to a user.
 *
 * Pattern: `<userId>/audio/<timestamp>-<random6>`
 *
 * - Timestamp prevents collisions across different uploads
 * - Random suffix prevents collisions within the same millisecond
 * - userId prefix creates a logical folder per user in Cloudinary
 *
 * @param {string} userId
 * @returns {string}
 */
const generatePublicId = (userId) => {
  const timestamp  = Date.now();
  const randomSuffix = crypto.randomBytes(3).toString('hex'); // 6-char hex string
  return `${userId}/audio/${timestamp}-${randomSuffix}`;
};

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload an audio buffer to Cloudinary under a user-scoped folder.
 *
 * Every call generates a unique public_id — no file is ever overwritten.
 *
 * @param {Buffer} buffer    - Raw audio data
 * @param {string} mimetype  - e.g. 'audio/mpeg'
 * @param {string} userId    - Used to scope the folder path in Cloudinary
 * @returns {Promise<{ cloudUrl: string, cloudPublicId: string, createdAt: Date }>}
 */
const uploadToCloud = (buffer, mimetype, userId) => {
  return new Promise((resolve, reject) => {
    const publicId = generatePublicId(userId);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type : 'video',   // Cloudinary uses 'video' for audio files
        public_id     : publicId,  // Unique ID — ensures no collision
        overwrite     : false,     // Explicitly prevent overwriting any existing asset
        access_mode   : 'public',
      },
      (error, result) => {
        if (error) {
          return reject(
            ApiError.internal(`Cloud upload failed: ${error.message}`)
          );
        }

        resolve({
          cloudUrl      : result.secure_url,
          cloudPublicId : result.public_id,
          createdAt     : new Date(),
        });
      }
    );

    // Convert buffer → readable stream → pipe to Cloudinary
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a single audio asset from Cloudinary by its public ID.
 *
 * Uses the stored `cloudPublicId` (e.g. `<userId>/audio/<timestamp>-<rand>`)
 * so only the targeted file is removed — never the entire user folder.
 *
 * Deletion failures are logged but not thrown so they don't break API responses.
 *
 * @param {string} cloudPublicId - The exact public_id returned during upload
 */
const deleteFromCloud = async (cloudPublicId) => {
  try {
    await cloudinary.uploader.destroy(cloudPublicId, { resource_type: 'video' });
  } catch (err) {
    console.error('[storageService] Cloud delete failed:', err.message);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { uploadToCloud, deleteFromCloud, generatePublicId };
