const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  errorType: {
    type: String,
    enum: ['CAMERA_DENIED', 'MIC_DENIED', 'STREAM_FAILED', 'TAB_SWITCH', 'NETWORK_LOST'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
  },
  deviceInfo: {
    type: Object,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// TTL Index: expire after 14 days
ErrorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 14 });

// Fast querying for students and exams
ErrorLogSchema.index({ userId: 1, examId: 1 });

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);
