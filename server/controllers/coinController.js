import axios from 'axios';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

// In-memory caches to protect against CoinGecko public API rate limits
let marketCache = {
  data: null,
  timestamp: 0
};

let detailsCache = {}; // id -> { data, timestamp }
let chartCache = {};   // id_days -> { data, timestamp }

const CACHE_DURATION = 60 * 1000; // 60 seconds cache lifespan

/**
 * Helper to strip HTML tags from a string
 */
const stripHtml = (htmlStr) => {
  if (!htmlStr) return '';
  return htmlStr.replace(/<[^>]*>/g, '');
};

/**
 * @route   GET /api/coins/markets
 * @desc    Get live cryptocurrency market list (cached)
 * @access  Public
 */
export const getMarkets = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, search = '', sortBy = 'marketCap', sortOrder = 'desc' } = req.query;
    const now = Date.now();

    if (!marketCache.data || now - marketCache.timestamp > CACHE_DURATION) {
      try {
        console.log('[CoinGecko API] Fetching live crypto market details...');
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
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
        if (!marketCache.data) {
          return errorResponse(res, 502, 'CoinGecko API is currently unavailable and no cached data is present.');
        }
        console.warn('[Fallback Service] Serving stale market data from cache...');
      }
    }

    if (!marketCache.data) {
      return errorResponse(res, 502, 'No market data available.');
    }

    let filteredList = [...marketCache.data];
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      filteredList = filteredList.filter(
        coin =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
    }

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

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(perPage, 10);
    const total = filteredList.length;
    const totalPages = Math.ceil(total / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    
    const paginatedList = filteredList.slice(startIndex, startIndex + limitNum);

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

/**
 * @route   GET /api/coins/:id
 * @desc    Get detailed coin metrics from CoinGecko (cached)
 * @access  Public
 */
export const getCoinDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    // Check if the specific coin details are already cached and still valid
    if (detailsCache[id] && now - detailsCache[id].timestamp < CACHE_DURATION) {
      console.log(`[Cache Hit] Serving coin details for '${id}' from memory...`);
      return successResponse(res, 200, 'Coin details retrieved successfully', detailsCache[id].data);
    }

    try {
      console.log(`[CoinGecko API] Fetching details for coin: ${id}...`);
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false
        },
        headers: { 'accept': 'application/json' }
      });

      const coinData = response.data;
      
      // Structure the response cleanly
      const mappedDetails = {
        id: coinData.id,
        name: coinData.name,
        symbol: coinData.symbol.toUpperCase(),
        image: coinData.image?.large || coinData.image?.small || '',
        rank: coinData.market_cap_rank,
        price: coinData.market_data?.current_price?.usd || 0,
        change24h: coinData.market_data?.price_change_percentage_24h || 0,
        marketCap: coinData.market_data?.market_cap?.usd || 0,
        volume24h: coinData.market_data?.total_volume?.usd || 0,
        circulatingSupply: coinData.market_data?.circulating_supply || 0,
        totalSupply: coinData.market_data?.total_supply || coinData.market_data?.max_supply || 0,
        ath: coinData.market_data?.ath?.usd || 0,
        atl: coinData.market_data?.atl?.usd || 0,
        description: stripHtml(coinData.description?.en || '')
      };

      // Save to cache
      detailsCache[id] = {
        data: mappedDetails,
        timestamp: now
      };

      return successResponse(res, 200, 'Coin details retrieved successfully', mappedDetails);
    } catch (apiErr) {
      console.error(`[CoinGecko Details Error] Failed to fetch details for ${id}:`, apiErr.message);
      
      // Fallback: If cache has details, return them
      if (detailsCache[id]) {
        console.warn(`[Fallback Service] Serving stale coin details for '${id}'...`);
        return successResponse(res, 200, 'Stale coin details retrieved successfully', detailsCache[id].data);
      }

      return errorResponse(res, 502, `Failed to retrieve coin details for '${id}' from CoinGecko API.`);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/coins/:id/chart
 * @desc    Get historical prices for charting from CoinGecko (cached)
 * @access  Public
 */
export const getCoinChart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    const now = Date.now();
    const cacheKey = `${id}_${days}`;

    // Check chart cache
    if (chartCache[cacheKey] && now - chartCache[cacheKey].timestamp < CACHE_DURATION) {
      console.log(`[Cache Hit] Serving chart data for '${cacheKey}' from memory...`);
      return successResponse(res, 200, 'Coin chart data retrieved successfully', chartCache[cacheKey].data);
    }

    try {
      console.log(`[CoinGecko API] Fetching historical chart for: ${id} (${days} days)...`);
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days
        },
        headers: { 'accept': 'application/json' }
      });

      const rawPrices = response.data?.prices || [];
      
      // Map historical prices: each price point is [timestamp, value]
      const chartPoints = rawPrices.map(([timestamp, val]) => {
        const dateObj = new Date(timestamp);
        // Clean formats depending on days filter
        let label = '';
        if (days === '1' || days === 1) {
          label = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === '7' || days === '30') {
          label = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
          label = dateObj.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        }

        return {
          time: label,
          price: val,
          timestamp // include raw timestamp
        };
      });

      // Save to cache
      chartCache[cacheKey] = {
        data: chartPoints,
        timestamp: now
      };

      return successResponse(res, 200, 'Coin chart data retrieved successfully', chartPoints);
    } catch (apiErr) {
      console.error(`[CoinGecko Chart Error] Failed to fetch chart for ${id}:`, apiErr.message);

      if (chartCache[cacheKey]) {
        console.warn(`[Fallback Service] Serving stale chart data for '${cacheKey}'...`);
        return successResponse(res, 200, 'Stale chart data retrieved successfully', chartCache[cacheKey].data);
      }

      return errorResponse(res, 502, `Failed to retrieve chart historical coordinates for '${id}' from CoinGecko API.`);
    }
  } catch (error) {
    next(error);
  }
};
