import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getIssues,
  updateIssueStatus,
  createIssue
} from '../controllers/adminController.js';

const router = express.Router();

// Public/User endpoint to report an issue (requires auth to associate with user, but we can make it accessible)
router.post('/issues', protect, createIssue);

// Admin only endpoints
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/issues', getIssues);
router.patch('/issues/:id', updateIssueStatus);

export default router;
