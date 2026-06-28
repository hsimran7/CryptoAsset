import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can watch a coin only once (compound unique index)
watchlistSchema.index({ userId: 1, coinId: 1 }, { unique: true });

const Watchlist = mongoose.model('Watchlist', watchlistSchema);
export default Watchlist;
