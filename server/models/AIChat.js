import mongoose from 'mongoose';

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: [true, 'Please provide the question.']
  },
  answer: {
    type: String,
    required: [true, 'Please provide the answer.']
  },
  contextCoins: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const AIChat = mongoose.model('AIChat', aiChatSchema);
export default AIChat;
