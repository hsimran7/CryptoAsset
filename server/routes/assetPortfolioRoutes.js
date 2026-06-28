import express from 'express';
import {
  addAsset,
  getAssets,
  updateAsset,
  deleteAsset
} from '../controllers/assetPortfolioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all endpoints
router.use(protect);

router.post('/', addAsset);
router.get('/', getAssets);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
