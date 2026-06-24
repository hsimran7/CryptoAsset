import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: [true, 'Asset symbol is required'],
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['ABOVE', 'BELOW'],
    required: [true, 'Alert type trigger condition is required']
  },
  value: {
    type: Number,
    required: [true, 'Price threshold target value is required'],
    min: [0, 'Target price cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
