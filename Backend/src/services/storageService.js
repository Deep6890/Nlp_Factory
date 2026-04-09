const supabase = require('../config/supabase');
const crypto   = require('crypto');
const ApiError = require('../utils/ApiError');

const BUCKET = 'recordings';

/**
 * Upload audio buffer to Supabase Storage.
 * Returns { storageUrl, storagePath }
 */
const uploadToStorage = async (buffer, mimetype, userId, originalname) => {
  const ext    = (originalname || 'audio.webm').split('.').pop() || 'webm';
  const rand   = crypto.randomBytes(4).toString('hex');
  const path   = `${userId}/${Date.now()}-${rand}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType:  mimetype || 'audio/webm',
      upsert:       false,
    });

  if (error) throw ApiError.internal(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    storagePath: path,
    storageUrl:  data.publicUrl,
  };
};

/**
 * Delete audio file from Supabase Storage by path.
 */
const deleteFromStorage = async (storagePath) => {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) console.error('[storage] delete failed:', error.message);
};

module.exports = { uploadToStorage, deleteFromStorage };
