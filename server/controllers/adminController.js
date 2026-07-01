import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Watchlist from '../models/Watchlist.js';
import AIChat from '../models/AIChat.js';
import AIAnalysis from '../models/AIAnalysis.js';
import Alert from '../models/Alert.js';
import AdminStats from '../models/AdminStats.js';
import Issue from '../models/Issue.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * GET /api/admin/stats
 * Compute platform metrics, update AdminStats singleton, and return full analytics
 */
export const getStats = async (req, res) => {
  try {
    // 1. Gather counts
    const totalUsers = await User.countDocuments();
    
    // Active users: joined in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ joinedDate: { $gte: thirtyDaysAgo } });

    const totalPortfolios = await Portfolio.countDocuments();
    const totalWatchlists = await Watchlist.countDocuments();
    const totalAIChats = await AIChat.countDocuments();
    const totalAIAnalyses = await AIAnalysis.countDocuments();
    const totalAlerts = await Alert.countDocuments();

    // 2. Update stats cache (singleton)
    let stats = await AdminStats.findOne();
    if (!stats) {
      stats = new AdminStats();
    }
    stats.totalUsers = totalUsers;
    stats.activeUsers = activeUsers;
    stats.totalPortfolios = totalPortfolios;
    stats.totalAIChats = totalAIChats;
    stats.totalAlerts = totalAlerts;
    stats.updatedAt = new Date();
    await stats.save();

    // 3. Additional Analytics: Recent Users
    const recentUsers = await User.find()
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ joinedDate: -1 })
      .limit(10);

    // 4. AI Usage Analytics (Grouped by Day for the last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const chatAgg = await AIChat.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          chatsCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const analysisAgg = await AIAnalysis.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          analysesCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Merge chat and analysis timeline logs
    const aiUsageMap = {};
    chatAgg.forEach(item => {
      aiUsageMap[item._id] = { date: item._id, chats: item.chatsCount, analyses: 0 };
    });
    analysisAgg.forEach(item => {
      if (aiUsageMap[item._id]) {
        aiUsageMap[item._id].analyses = item.analysesCount;
      } else {
        aiUsageMap[item._id] = { date: item._id, chats: 0, analyses: item.analysesCount };
      }
    });

    const aiUsage = Object.values(aiUsageMap).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Issues Breakdown counts
    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: 'open' });
    const inProgressIssues = await Issue.countDocuments({ status: 'in-progress' });
    const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });

    return successResponse(res, 200, 'Admin statistics loaded successfully', {
      stats: {
        totalUsers,
        activeUsers,
        totalPortfolios,
        totalWatchlists,
        totalAIChats,
        totalAIAnalyses,
        totalAlerts,
        updatedAt: stats.updatedAt
      },
      recentUsers,
      aiUsage,
      issuesOverview: {
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues
      }
    });
  } catch (error) {
    console.error('[Admin Stats Error]:', error);
    return errorResponse(res, 500, 'Failed to fetch admin stats: ' + error.message);
  }
};

/**
 * GET /api/admin/users
 * Fetch all users with basic info
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ joinedDate: -1 });
    return successResponse(res, 200, 'Users retrieved successfully', users);
  } catch (error) {
    console.error('[Admin Users Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve users: ' + error.message);
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Update user role (user/admin/USER/ADMIN)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin', 'USER', 'ADMIN'].includes(role)) {
      return errorResponse(res, 400, 'Invalid role value provided');
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prevent changing own admin status
    if (req.user._id.toString() === user._id.toString()) {
      return errorResponse(res, 400, 'Cannot modify your own administrative status');
    }

    user.role = role.toLowerCase(); // keep clean internal case
    await user.save();

    return successResponse(res, 200, `User role updated to ${role} successfully`, {
      _id: user._id,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('[Admin Update User Role Error]:', error);
    return errorResponse(res, 500, 'Failed to update user role: ' + error.message);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user and clean up their associated data (portfolios, watchlists, etc.)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prevent deleting self
    if (req.user._id.toString() === user._id.toString()) {
      return errorResponse(res, 400, 'Cannot self-delete administrative accounts');
    }

    // 1. Delete associated data
    await Portfolio.deleteMany({ userId: id });
    await Watchlist.deleteMany({ userId: id });
    await AIChat.deleteMany({ userId: id });
    await AIAnalysis.deleteMany({ userId: id });
    await Alert.deleteMany({ userId: id });
    await Issue.deleteMany({ user: id });

    // 2. Delete the user
    await User.findByIdAndDelete(id);

    return successResponse(res, 200, 'User and all related records deleted successfully');
  } catch (error) {
    console.error('[Admin Delete User Error]:', error);
    return errorResponse(res, 500, 'Failed to delete user: ' + error.message);
  }
};

/**
 * GET /api/admin/issues
 * Fetch all reported issues
 */
export const getIssues = async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });
    return successResponse(res, 200, 'Reported issues retrieved successfully', issues);
  } catch (error) {
    console.error('[Admin Get Issues Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve reported issues: ' + error.message);
  }
};

/**
 * PATCH /api/admin/issues/:id
 * Update status of reported issue
 */
export const updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'in-progress', 'resolved'].includes(status)) {
      return errorResponse(res, 400, 'Invalid status value provided');
    }

    const issue = await Issue.findById(id).populate('user', 'name email');
    if (!issue) {
      return errorResponse(res, 404, 'Issue report not found');
    }

    issue.status = status;
    await issue.save();

    return successResponse(res, 200, `Issue status updated to ${status} successfully`, issue);
  } catch (error) {
    console.error('[Admin Update Issue Error]:', error);
    return errorResponse(res, 500, 'Failed to update issue status: ' + error.message);
  }
};

/**
 * POST /api/admin/issues (Public/User route)
 * File a new issue/bug report
 */
export const createIssue = async (req, res) => {
  try {
    const { email, title, description } = req.body;

    if (!email || !title || !description) {
      return errorResponse(res, 400, 'Please provide email, title, and description');
    }

    const newIssue = new Issue({
      user: req.user ? req.user._id : null,
      email,
      title,
      description,
      status: 'open'
    });

    await newIssue.save();
    return successResponse(res, 201, 'Issue reported successfully. Thank you for your feedback!', newIssue);
  } catch (error) {
    console.error('[Create Issue Error]:', error);
    return errorResponse(res, 500, 'Failed to file issue report: ' + error.message);
  }
};
