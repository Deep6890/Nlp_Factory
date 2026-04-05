const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    filename: {
      type:    String,
      default: 'audio',
    },
    cloudUrl: {
      type:     String,
      required: true,
    },
    cloudPublicId: {
      type:     String,
      required: true,
      unique:   true,
    },
    mimeType: {
      type: String,
    },
    size: {
      type: Number, // bytes
    },
    duration: {
      type: Number, // seconds
    },
    mode: {
      type:    String,
      enum:    ['adaptive', 'conservative', 'priority', 'legacy'],
      default: 'adaptive',
    },
    recordedAt: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

recordingSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret._id    = ret._id.toString();
    ret.userId = ret.userId.toString();
    delete ret.__v;
    return ret;
  },
});

const Recording = mongoose.model('Recording', recordingSchema);
module.exports = Recording;
