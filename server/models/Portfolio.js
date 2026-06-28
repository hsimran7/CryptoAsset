import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coinId: {
    type: String,
    required: [true, 'Please provide the CoinGecko Coin ID (e.g. bitcoin)']
  },
  coinName: {
    type: String,
    required: [true, 'Please provide the Coin Name (e.g. Bitcoin)']
  },
  symbol: {
    type: String,
    required: [true, 'Please provide the Asset Symbol (e.g. BTC)'],
    uppercase: true,
    trim: true
  },
  coinImage: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide the asset quantity'],
    min: [0.00000001, 'Quantity must be greater than zero']
  },
  buyPrice: {
    type: Number,
    required: [true, 'Please provide the purchase price in USD'],
    min: [0, 'Purchase price must be non-negative']
  },
  buyDate: {
    type: Date,
    required: [true, 'Please provide the purchase date'],
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to help lookup a user's assets quickly
portfolioSchema.index({ userId: 1, symbol: 1 });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
