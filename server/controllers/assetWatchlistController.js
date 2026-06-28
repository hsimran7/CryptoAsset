import axios from 'axios';
import Watchlist from '../models/Watchlist.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Cache for live simple coin details to protect against CoinGecko rate limits
let watchlistPriceCache = {
  data: {}, // coinId -> { price, change24h }
  timestamp: 0
};
const CACHE_DURATION = 60 * 1000; // 60 seconds cache lifespan

/**
 * Helper to fetch live simple prices and 24h percentage change for a list of CoinGecko coin IDs
 */
const fetchLiveWatchlistDetails = async (coinIds) => {
  const now = Date.now();

  // If cache is still valid, return cached data
  if (now - watchlistPriceCache.timestamp < CACHE_DURATION && Object.keys(watchlistPriceCache.data).length > 0) {
    return watchlistPriceCache.data;
  }

  try {
    if (coinIds.length === 0) return {};

    console.log(`[CoinGecko API] Fetching details for watchlist: ${coinIds.join(', ')}`);
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: coinIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: true
      },
      headers: { 'accept': 'application/json' }
    });

    const detailsMap = {};
    coinIds.forEach(id => {
      detailsMap[id] = {
        price: response.data[id]?.usd || 0,
        change24h: response.data[id]?.usd_24h_change || 0
      };
    });

    // Save to cache
    watchlistPriceCache.data = { ...watchlistPriceCache.data, ...detailsMap };
    watchlistPriceCache.timestamp = now;

    return watchlistPriceCache.data;
  } catch (err) {
    console.error('[Watchlist Price Fetch Warning] Failed to query live prices, serving cached details if available:', err.message);
    return watchlistPriceCache.data; // Fall back to whatever is currently cached
  }
};

/**
 * @route   POST /api/watchlist
 * @desc    Add a cryptocurrency coin to user's watchlist
 * @access  Private
 */
export const addToWatchlist = async (req, res, next) => {
  try {
    const { coinId, coinName, symbol, coinImage } = req.body;

    if (!coinId || !coinName || !symbol) {
      return errorResponse(res, 400, 'Please provide all required fields: coinId, coinName, symbol');
    }

    // Check if already watchlisted by this user
    const existing = await Watchlist.findOne({ userId: req.user._id, coinId });
    if (existing) {
      return errorResponse(res, 400, 'This coin is already in your watchlist');
    }

    const item = await Watchlist.create({
      userId: req.user._id,
      coinId,
      coinName,
      symbol: symbol.toUpperCase().trim(),
      coinImage: coinImage || ''
    });

    return successResponse(res, 201, 'Coin added successfully to watchlist', item);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/watchlist
 * @desc    View all coins on the user's watchlist with live pricing and 24h change
 * @access  Private
 */
export const getWatchlist = async (req, res, next) => {
  try {
    const watchlistItems = await Watchlist.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Extract unique coin IDs
    const uniqueCoinIds = [...new Set(watchlistItems.map(item => item.coinId))];

    // Fetch live prices and 24h changes
    const liveDetails = await fetchLiveWatchlistDetails(uniqueCoinIds);

    // Merge live details
    const itemsWithLiveDetails = watchlistItems.map(item => {
      const live = liveDetails[item.coinId] || { price: 0, change24h: 0 };
      return {
        ...item.toObject(),
        price: live.price,
        change24h: live.change24h
      };
    });

    return successResponse(res, 200, 'Watchlist items retrieved successfully', itemsWithLiveDetails);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/watchlist/:coinId
 * @desc    Remove a coin from the user's watchlist by coinId
 * @access  Private
 */
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const { coinId } = req.params;

    const item = await Watchlist.findOne({ userId: req.user._id, coinId });
    if (!item) {
      return errorResponse(res, 404, 'Watchlist item not found');
    }

    await item.deleteOne();

    return successResponse(res, 200, 'Coin removed successfully from watchlist');
  } catch (error) {
    next(error);
  }
};
