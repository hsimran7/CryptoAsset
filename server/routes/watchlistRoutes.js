import express from 'express';
import { getWatchlist, toggleWatchlistSymbol } from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all watchlist endpoints
router.use(protect);

router.get('/', getWatchlist);
router.post('/toggle', toggleWatchlistSymbol);

export default router;
