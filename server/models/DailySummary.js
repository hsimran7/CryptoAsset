import mongoose from 'mongoose';

/**
 * DailySummary — stores one cached AI-generated daily market summary per calendar day.
 * The controller checks if a record for today's UTC date already exists before re-fetching.
 */
const dailySummarySchema = new mongoose.Schema({
  dateKey: {
    type: String,       // Format: 'YYYY-MM-DD' UTC — used as the once-per-day key
    required: true,
    unique: true
  },
  // CoinGecko data snapshots
  trendingCoins: { type: Array, default: [] },
  topGainers:    { type: Array, default: [] },
  topLosers:     { type: Array, default: [] },
  // News articles (from CryptoCompare or fallback)
  newsArticles:  { type: Array, default: [] },
  // Per-article sentiment results [{ title, url, sentiment, sentimentScore, explanation }]
  newsSentiment: { type: Array, default: [] },
  // Overall market sentiment: 'Positive' | 'Neutral' | 'Negative'
  overallSentiment: { type: String, default: 'Neutral' },
  // Gemini AI narratives
  aiSummary:      { type: String, default: '' },   // pro/detailed
  beginnerSummary:{ type: String, default: '' },   // beginner-friendly paragraph
  // Meta
  generatedAt: { type: Date, default: Date.now }
});

const DailySummary = mongoose.model('DailySummary', dailySummarySchema);
export default DailySummary;
