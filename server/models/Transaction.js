import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL', 'DEPOSIT', 'WITHDRAW'],
    required: [true, 'Transaction type is required']
  },
  symbol: {
    type: String,
    required: [true, 'Asset symbol is required'],
    trim: true,
    uppercase: true
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.0000001, 'Amount must be positive']
  },
  price: {
    type: Number,
    required: [true, 'Asset price is required'],
    min: [0, 'Price cannot be negative']
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
