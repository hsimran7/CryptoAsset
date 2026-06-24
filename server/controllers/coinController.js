import axios from 'axios';
import { errorResponse } from '../utils/apiResponse.js';

// Simple in-memory cache to stay within CoinGecko public API rate limits (normally 10-30 requests/min)
let marketCache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION = 60 * 1000; // 60 seconds cache lifespan

/**
 * @route   GET /api/coins/markets
 * @desc    Get live cryptocurrency market data (with search, sort, pagination, and caching proxy)
 * @access  Public
 */
export const getMarkets = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, search = '', sortBy = 'marketCap', sortOrder = 'desc' } = req.query;
    const now = Date.now();

    // 1. Fetch fresh data from CoinGecko if cache is expired or empty
    if (!marketCache.data || now - marketCache.timestamp > CACHE_DURATION) {
      try {
        console.log('[CoinGecko API] Fetching live crypto market details...');
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100, // retrieve top 100 to allow search and sorting locally
            page: 1,
            sparkline: true,
            price_change_percentage: '24h',
            locale: 'en'
          },
          headers: {
            'accept': 'application/json'
          }
        });

        if (Array.isArray(response.data)) {
          marketCache.data = response.data;
          marketCache.timestamp = now;
        }
      } catch (apiErr) {
        console.error('[CoinGecko Fetch Warning]', apiErr.message);
        // Fallback: If cache exists, serve stale data. Otherwise throw error.
        if (!marketCache.data) {
          return errorResponse(res, 502, 'CoinGecko API is currently unavailable and no cached data is present.');
        }
        console.warn('[Fallback Service] Serving stale market data from cache...');
      }
    }

    // Ensure cache has data
    if (!marketCache.data) {
      return errorResponse(res, 502, 'No market data available.');
    }

    // 2. Perform Local Search Filtering
    let filteredList = [...marketCache.data];
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      filteredList = filteredList.filter(
        coin =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
    }

    // 3. Perform Local Sorting
    // Map request field names to CoinGecko data fields
    const sortFieldMap = {
      price: 'current_price',
      change24h: 'price_change_percentage_24h',
      marketCap: 'market_cap',
      volume: 'total_volume',
      rank: 'market_cap_rank',
      name: 'name'
    };

    const targetSortField = sortFieldMap[sortBy] || 'market_cap';
    filteredList.sort((a, b) => {
      let aVal = a[targetSortField];
      let bVal = b[targetSortField];

      // Handle null/undefined values safely
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // 4. Perform Local Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(perPage, 10);
    const total = filteredList.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    
    const paginatedList = filteredList.slice(startIndex, startIndex + limitNum);

    // 5. Structure API response
    const coins = paginatedList.map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      rank: coin.market_cap_rank,
      sparkline: coin.sparkline_in_7d ? coin.sparkline_in_7d.price : []
    }));

    return res.status(200).json({
      success: true,
      message: 'Live market data retrieved successfully',
      data: {
        coins,
        pagination: {
          total,
          page: pageNum,
          perPage: limitNum,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
