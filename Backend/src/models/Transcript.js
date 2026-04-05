const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    recordingId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Recording',
      required: true,
      unique:   true, // One transcript per recording (1:1 relationship)
      index:    true,
    },
    text: {
      type:    String,
      default: '',
    },
    language: {
      type:    String,
      default: 'en',
    },
    confidence: {
      type: Number,
      min:  0,
      max:  1,
    },
    keywords: {
      type:    [String],
      default: [],
    },
    summary: {
      type:    String,
      default: '',
    },
    // Full 15-key insights JSON from the AI pipeline
    insights: {
      type:    Object,
      default: null,
    },
    status: {
      type:     String,
      enum:     ['pending', 'processing', 'done', 'failed'],
      default:  'pending',
      required: true,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }
);

transcriptSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret._id         = ret._id.toString();
    ret.userId      = ret.userId.toString();
    ret.recordingId = ret.recordingId.toString();
    delete ret.__v;
    return ret;
  },
});

const Transcript = mongoose.model('Transcript', transcriptSchema);
module.exports = Transcript;
