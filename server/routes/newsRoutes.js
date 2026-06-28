import express from 'express';
import { getNewsSentiment } from '../controllers/newsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All news routes are protected
router.use(protect);

// GET /api/news/sentiment — returns today's per-article sentiment results
router.get('/sentiment', getNewsSentiment);

export default router;
