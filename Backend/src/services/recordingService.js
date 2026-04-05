const Recording = require('../models/Recording');
const ApiError  = require('../utils/ApiError');

/**
 * Persist a new recording document after Cloudinary upload.
 *
 * @param {string} userId
 * @param {{ filename, cloudUrl, cloudPublicId, mimeType, size, duration? }} payload
 * @returns {Promise<Recording>}
 */
const createRecording = async (userId, { filename, cloudUrl, cloudPublicId, mimeType, size, duration, mode, recordedAt, status }) => {
  const recording = await Recording.create({
    userId,
    cloudUrl,
    cloudPublicId,
    filename:   filename   || 'audio',
    mimeType:   mimeType   || null,
    size:       size       || null,
    duration:   duration   || null,
    mode:       mode       || 'adaptive',
    recordedAt: recordedAt || null,
    status:     status     || 'processing',
  });
  return recording.toJSON();
};

/**
 * Paginated list of recordings for a user, newest first.
 *
 * @param {string} userId
 * @param {{ page?: number, limit?: number }} options
 */
const getUserRecordings = async (userId, { page = 1, limit = 10 } = {}) => {
  const pageNum  = Math.max(1, Number(page)  || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip     = (pageNum - 1) * limitNum;

  const [recordings, total] = await Promise.all([
    Recording.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Recording.countDocuments({ userId }),
  ]);

  // Normalise ObjectIds to strings for lean results
  const audios = recordings.map((r) => ({
    ...r,
    _id:    r._id.toString(),
    userId: r.userId.toString(),
  }));

  return { audios, total, page: pageNum, limit: limitNum };
};

/**
 * Fetch a single recording that belongs to the given user (or any if admin).
 *
 * @param {string} id         - Recording _id
 * @param {string} userId     - Requesting user _id
 * @param {string} [role]     - 'admin' bypasses ownership check
 */
const getRecordingById = async (id, userId, role) => {
  const query = role === 'admin' ? { _id: id } : { _id: id, userId };

  const recording = await Recording.findOne(query).lean();
  if (!recording) throw ApiError.notFound('Recording not found');

  return {
    ...recording,
    _id:    recording._id.toString(),
    userId: recording.userId.toString(),
  };
};

/**
 * Delete a recording owned by userId. Returns the deleted doc for downstream cleanup.
 *
 * @param {string} id
 * @param {string} userId
 * @param {string} [role]
 */
const deleteRecording = async (id, userId, role) => {
  const query = role === 'admin' ? { _id: id } : { _id: id, userId };

  const recording = await Recording.findOneAndDelete(query).lean();
  if (!recording) throw ApiError.notFound('Recording not found');

  return {
    ...recording,
    _id:    recording._id.toString(),
    userId: recording.userId.toString(),
  };
};

/**
 * Update a recording by id.
 *
 * @param {string} id
 * @param {object} updateData
 * @param {string} [userId] - Optional, if we want to scope to a specific user
 */
const updateRecording = async (id, updateData, userId = null) => {
  const query = { _id: id };
  if (userId) query.userId = userId;

  const recording = await Recording.findOneAndUpdate(
    query,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  if (!recording) throw ApiError.notFound('Recording not found');

  return {
    ...recording,
    _id:    recording._id.toString(),
    userId: recording.userId.toString(),
  };
};

module.exports = { createRecording, getUserRecordings, getRecordingById, deleteRecording, updateRecording };
