import express from 'express';
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist
} from '../controllers/assetWatchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all endpoints
router.use(protect);

router.post('/', addToWatchlist);
router.get('/', getWatchlist);
router.delete('/:coinId', removeFromWatchlist);

export default router;
