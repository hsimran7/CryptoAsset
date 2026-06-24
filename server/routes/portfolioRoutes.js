import express from 'express';
import {
  getPortfolioState,
  executeTrade,
  depositCash,
  withdrawCash,
  getTransactions
} from '../controllers/portfolioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all portfolio endpoints
router.use(protect);

router.get('/', getPortfolioState);
router.post('/trade', executeTrade);
router.post('/deposit', depositCash);
router.post('/withdraw', withdrawCash);
router.get('/transactions', getTransactions);

export default router;
