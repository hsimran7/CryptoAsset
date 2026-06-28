import mongoose from 'mongoose';

/**
 * Report — stores a log entry every time a user generates a report.
 * The actual file content is generated on-demand (PDF client-side, CSV server-side).
 */
const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['PDF', 'CSV'],
    required: true
  },
  // Optional: store a short description or filename
  fileName: {
    type: String,
    default: ''
  },
  // For server-generated files we could store a path; for now we leave it empty
  // since PDF is generated client-side and CSV is streamed directly
  fileUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reportSchema.index({ userId: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
