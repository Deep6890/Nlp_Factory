/**
 * config/cloudinary.js
 * Configures and exports the Cloudinary instance.
 * Reads credentials from environment variables.
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Verify config on startup
const cfg = cloudinary.config();
if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
  console.warn(
    '[Cloudinary] WARNING: Missing credentials. ' +
    'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env'
  );
}

module.exports = cloudinary;
