import express from 'express';
import { getMarkets, getCoinDetails, getCoinChart } from '../controllers/coinController.js';

const router = express.Router();

// Define routes for fetching market coins
router.get('/markets', getMarkets);
router.get('/:id', getCoinDetails);
router.get('/:id/chart', getCoinChart);

export default router;
