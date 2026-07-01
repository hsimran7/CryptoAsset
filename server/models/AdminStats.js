import mongoose from 'mongoose';

const adminStatsSchema = new mongoose.Schema({
  totalUsers: {
    type: Number,
    required: true,
    default: 0
  },
  activeUsers: {
    type: Number,
    required: true,
    default: 0
  },
  totalPortfolios: {
    type: Number,
    required: true,
    default: 0
  },
  totalAIChats: {
    type: Number,
    required: true,
    default: 0
  },
  totalAlerts: {
    type: Number,
    required: true,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const AdminStats = mongoose.model('AdminStats', adminStatsSchema);
export default AdminStats;
