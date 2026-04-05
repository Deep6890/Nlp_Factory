/**
 * models/Recording.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mongoose schema for audio recordings uploaded by Armor.ai users.
 *
 * KEY FIELDS ADDED vs the broken version:
 *   • transcript      — the actual STT text (was completely missing)
 *   • status          — pending | processing | completed | failed
 *   • transcriptLang  — e.g. 'hi', 'bn', 'ta'
 *   • transcriptModel — which AI4Bharat model produced it
 *   • transcriptError — last error message if status=failed
 *   • transcriptedAt  — timestamp when transcription finished
 */

const mongoose = require('mongoose');

const RecordingSchema = new mongoose.Schema(
  {
    // ── Core identity ──────────────────────────────────────────────────────
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'userId is required'],
      index:    true,
    },

    // ── File metadata ──────────────────────────────────────────────────────
    filename: {
      type:     String,
      required: [true, 'filename is required'],
      trim:     true,
    },
    mimeType: {
      type:    String,
      default: 'audio/webm',
    },
    size: {
      type:    Number,
      default: 0,
      min:     0,
    },
    duration: {
      type:    Number,   // seconds
      default: null,
    },

    // ── Cloudinary ─────────────────────────────────────────────────────────
    cloudUrl: {
      type:     String,
      required: [true, 'cloudUrl is required'],
    },
    cloudPublicId: {
      type:     String,
      required: [true, 'cloudPublicId is required'],
    },

    // ── Session context ────────────────────────────────────────────────────
    mode: {
      type:    String,
      enum:    ['adaptive', 'legacy'],
      default: 'adaptive',
    },
    recordedAt: {
      type:    Date,
      default: Date.now,
    },

    // ── Transcription ──────────────────────────────────────────────────────
    /**
     * status lifecycle:
     *   pending     → initial save (before any transcription attempt)
     *   processing  → Python bridge has been spawned
     *   completed   → transcript stored successfully
     *   failed      → Python returned an error or timed out
     */
    status: {
      type:    String,
      enum:    ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index:   true,
    },
    transcript: {
      type:    String,
      default: null,
    },
    transcriptLang: {
      type:    String,
      default: 'hi',
    },
    transcriptModel: {
      type:    String,
      enum:    ['indicwhisper', 'indicwav2vec', 'indicconformer'],
      default: 'indicwhisper',
    },
    transcriptError: {
      type:    String,
      default: null,
    },
    transcriptedAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,       // adds createdAt + updatedAt automatically
    versionKey: '__v',
  }
);

// ── Compound indexes for common query patterns ─────────────────────────────
RecordingSchema.index({ userId: 1, recordedAt: -1 });   // user history feed
RecordingSchema.index({ userId: 1, status: 1 });         // filter by status
RecordingSchema.index({ status: 1, createdAt: 1 });      // retry-queue scan

// ── Virtual: has transcript been produced? ─────────────────────────────────
RecordingSchema.virtual('isTranscribed').get(function () {
  return this.status === 'completed' && this.transcript != null;
});

// ── Static helper: retry all failed docs ──────────────────────────────────
RecordingSchema.statics.findFailed = function () {
  return this.find({ status: 'failed' }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Recording', RecordingSchema);
