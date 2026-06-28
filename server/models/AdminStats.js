import mongoose from 'mongoose';

/**
 * AdminStats — a single cached document holding aggregate platform metrics.
 * Refreshed on every call to GET /api/admin/stats.
 * Using a singleton pattern: we always upsert with a fixed docId.
 */
const adminStatsSchema = new mongoose.Schema({
  docId: { type: String, default: 'singleton', unique: true },

  // User metrics
  totalUsers:      { type: Number, default: 0 },
  activeUsers:     { type: Number, default: 0 }, // users who joined in last 30 days
  verifiedUsers:   { type: Number, default: 0 },
  adminUsers:      { type: Number, default: 0 },

  // Feature usage metrics
  totalPortfolios: { type: Number, default: 0 },
  totalWatchlists: { type: Number, default: 0 },
  totalAIChats:    { type: Number, default: 0 },
  totalAIAnalyses: { type: Number, default: 0 },
  totalAlerts:     { type: Number, default: 0 },
  totalReports:    { type: Number, default: 0 },

  updatedAt: { type: Date, default: Date.now }
});

const AdminStats = mongoose.model('AdminStats', adminStatsSchema);
export default AdminStats;
