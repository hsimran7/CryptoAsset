import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'in-progress'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
