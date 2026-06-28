import express from 'express';
import { askAssistant, getChatHistory, clearChatHistory, analyzePortfolio, getAnalysisHistory, compareCoins } from '../controllers/aiController.js';
import { getDailySummary } from '../controllers/newsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all AI endpoints
router.use(protect);

router.post('/chat', askAssistant);
router.get('/chat-history', getChatHistory);
router.delete('/chat-history', clearChatHistory);

// Portfolio analyzer
router.post('/analyze-portfolio', analyzePortfolio);
router.get('/analysis-history', getAnalysisHistory);

// Daily market summary (once per day cached)
router.get('/daily-summary', getDailySummary);

// Coin comparison
router.post('/compare-coins', compareCoins);

export default router;

