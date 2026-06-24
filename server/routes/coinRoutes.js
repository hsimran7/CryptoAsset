import express from 'express';
import { getMarkets } from '../controllers/coinController.js';

const router = express.Router();

// Define route for fetching market coins
router.get('/markets', getMarkets);

export default router;
