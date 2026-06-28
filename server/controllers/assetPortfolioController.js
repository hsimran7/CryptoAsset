import axios from 'axios';
import Portfolio from '../models/Portfolio.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Cache for live simple coin prices to protect against CoinGecko rate limits
let priceCache = {
  data: {}, // coinId -> priceUSD
  timestamp: 0
};
const CACHE_DURATION = 60 * 1000; // 60 seconds cache lifespan

/**
 * Helper to fetch live prices for a list of CoinGecko coin IDs
 */
const fetchLivePrices = async (coinIds) => {
  const now = Date.now();
  
  // If cache is still valid, return cached prices
  if (now - priceCache.timestamp < CACHE_DURATION && Object.keys(priceCache.data).length > 0) {
    return priceCache.data;
  }

  try {
    if (coinIds.length === 0) return {};
    
    console.log(`[CoinGecko API] Fetching simple prices for: ${coinIds.join(', ')}`);
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: coinIds.join(','),
        vs_currencies: 'usd'
      },
      headers: { 'accept': 'application/json' }
    });

    const pricesMap = {};
    coinIds.forEach(id => {
      pricesMap[id] = response.data[id]?.usd || 0;
    });

    // Save to cache
    priceCache.data = { ...priceCache.data, ...pricesMap };
    priceCache.timestamp = now;
    
    return priceCache.data;
  } catch (err) {
    console.error('[Price Fetch Warning] Failed to query live prices, serving cached prices if available:', err.message);
    return priceCache.data; // Fall back to whatever is currently cached
  }
};

/**
 * @route   POST /api/portfolio
 * @desc    Add a new custom asset to user's portfolio ledger
 * @access  Private
 */
export const addAsset = async (req, res, next) => {
  try {
    const { coinId, coinName, symbol, coinImage, quantity, buyPrice, buyDate, notes } = req.body;

    if (!coinId || !coinName || !symbol || quantity === undefined || buyPrice === undefined || !buyDate) {
      return errorResponse(res, 400, 'Please provide all required asset fields: coinId, coinName, symbol, quantity, buyPrice, buyDate');
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(buyPrice);

    if (isNaN(qty) || qty <= 0) {
      return errorResponse(res, 400, 'Quantity must be a valid number greater than zero');
    }
    if (isNaN(price) || price < 0) {
      return errorResponse(res, 400, 'Purchase price must be a valid non-negative number');
    }

    const asset = await Portfolio.create({
      userId: req.user._id,
      coinId,
      coinName,
      symbol: symbol.toUpperCase().trim(),
      coinImage: coinImage || '',
      quantity: qty,
      buyPrice: price,
      buyDate: new Date(buyDate),
      notes: notes || ''
    });

    return successResponse(res, 201, 'Asset entry added successfully to portfolio ledger', asset);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/portfolio
 * @desc    View all assets in the portfolio with live performance calculations
 * @access  Private
 */
export const getAssets = async (req, res, next) => {
  try {
    const assets = await Portfolio.find({ userId: req.user._id }).sort({ buyDate: -1 });

    // Extract unique coin IDs
    const uniqueCoinIds = [...new Set(assets.map(a => a.coinId))];
    
    // Fetch live prices (with caching)
    const livePrices = await fetchLivePrices(uniqueCoinIds);

    // Compute live performance metrics for each asset
    const assetsWithMetrics = assets.map(asset => {
      // Look up live price from CoinGecko results, default to buyPrice as fallback if API fails completely
      const currentPrice = livePrices[asset.coinId] !== undefined && livePrices[asset.coinId] !== 0
        ? livePrices[asset.coinId]
        : asset.buyPrice;

      const totalInvested = parseFloat((asset.quantity * asset.buyPrice).toFixed(2));
      const currentValue = parseFloat((asset.quantity * currentPrice).toFixed(2));
      const profitValue = parseFloat((currentValue - totalInvested).toFixed(2));
      const roi = totalInvested === 0 ? 0 : parseFloat(((profitValue / totalInvested) * 100).toFixed(2));

      return {
        ...asset.toObject(),
        currentPrice,
        totalInvested,
        currentValue,
        profitValue,
        roi
      };
    });

    // Compute aggregate performance metrics
    const totalInvested = parseFloat(assetsWithMetrics.reduce((sum, a) => sum + a.totalInvested, 0).toFixed(2));
    const currentValue = parseFloat(assetsWithMetrics.reduce((sum, a) => sum + a.currentValue, 0).toFixed(2));
    const totalProfitValue = parseFloat((currentValue - totalInvested).toFixed(2));
    const totalRoi = totalInvested === 0 ? 0 : parseFloat(((totalProfitValue / totalInvested) * 100).toFixed(2));

    return successResponse(res, 200, 'Portfolio ledger assets retrieved successfully', {
      assets: assetsWithMetrics,
      summary: {
        totalInvested,
        currentValue,
        totalProfitValue,
        totalRoi
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/portfolio/:id
 * @desc    Edit a custom portfolio asset entry details
 * @access  Private
 */
export const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, buyPrice, buyDate, notes } = req.body;

    let asset = await Portfolio.findOne({ _id: id, userId: req.user._id });
    if (!asset) {
      return errorResponse(res, 404, 'Asset entry not found or user is not authorized');
    }

    if (quantity !== undefined) {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        return errorResponse(res, 400, 'Quantity must be a valid number greater than zero');
      }
      asset.quantity = qty;
    }

    if (buyPrice !== undefined) {
      const price = parseFloat(buyPrice);
      if (isNaN(price) || price < 0) {
        return errorResponse(res, 400, 'Purchase price must be a valid non-negative number');
      }
      asset.buyPrice = price;
    }

    if (buyDate) {
      asset.buyDate = new Date(buyDate);
    }

    if (notes !== undefined) {
      asset.notes = notes;
    }

    await asset.save();

    return successResponse(res, 200, 'Asset entry updated successfully', asset);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/portfolio/:id
 * @desc    Delete a portfolio asset entry from ledger
 * @access  Private
 */
export const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await Portfolio.findOne({ _id: id, userId: req.user._id });
    if (!asset) {
      return errorResponse(res, 404, 'Asset entry not found or user is not authorized');
    }

    await asset.deleteOne();

    return successResponse(res, 200, 'Asset entry deleted successfully from ledger');
  } catch (error) {
    next(error);
  }
};
