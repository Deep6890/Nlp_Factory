const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

const createRecording = async (userId, { filename, storageUrl, storagePath, mimeType, size, duration, recordedAt }) => {
  const { data, error } = await supabase
    .from('recordings')
    .insert({
      user_id:      userId,
      filename:     filename   || 'audio',
      storage_url:  storageUrl,
      storage_path: storagePath,
      mime_type:    mimeType   || null,
      size:         size       || null,
      duration:     duration   || null,
      recorded_at:  recordedAt || null,
    })
    .select()
    .single();

  if (error) throw ApiError.internal(error.message);
  return _map(data);
};

const getUserRecordings = async (userId, { page = 1, limit = 10 } = {}) => {
  const pageNum  = Math.max(1, Number(page)  || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
  const from     = (pageNum - 1) * limitNum;

  const { data, error, count } = await supabase
    .from('recordings')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, from + limitNum - 1);

  if (error) throw ApiError.internal(error.message);
  return { audios: (data || []).map(_map), total: count || 0, page: pageNum, limit: limitNum };
};

const getRecordingById = async (id, userId, role) => {
  let q = supabase.from('recordings').select('*').eq('id', id);
  if (role !== 'admin') q = q.eq('user_id', userId);
  const { data, error } = await q.single();
  if (error || !data) throw ApiError.notFound('Recording not found');
  return _map(data);
};

const deleteRecording = async (id, userId, role) => {
  if (role !== 'admin') {
    const { data: rec } = await supabase.from('recordings').select('user_id').eq('id', id).single();
    if (!rec || rec.user_id !== userId) throw ApiError.notFound('Recording not found');
  }
  const { data, error } = await supabase.from('recordings').delete().eq('id', id).select().single();
  if (error || !data) throw ApiError.notFound('Recording not found');
  return _map(data);
};

const _map = (r) => ({
  _id:         r.id,
  userId:      r.user_id,
  filename:    r.filename,
  storageUrl:  r.storage_url,
  storagePath: r.storage_path,
  mimeType:    r.mime_type,
  size:        r.size,
  duration:    r.duration,
  recordedAt:  r.recorded_at,
  createdAt:   r.created_at,
  updatedAt:   r.updated_at,
});

module.exports = { createRecording, getUserRecordings, getRecordingById, deleteRecording };
