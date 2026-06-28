import { Server } from 'socket.io';
import axios from 'axios';

let io = null;
let intervalId = null;
let simulationId = null;

// Maintain cached price state
const priceState = {
  bitcoin: { price: 60233.00, change24h: 0.02 },
  ethereum: { price: 3559.37, change24h: 0.23 },
  solana: { price: 149.82, change24h: 0.17 },
  chainlink: { price: 13.45, change24h: -1.25 },
  'fetch-ai': { price: 1.15, change24h: 3.42 }
};

// Map CoinGecko IDs to symbols
const idToSymbol = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  chainlink: 'LINK',
  'fetch-ai': 'FET'
};

/**
 * Fetch live prices from CoinGecko simple price API
 */
const fetchLatestPrices = async () => {
  try {
    const ids = Object.keys(priceState).join(',');
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids,
        vs_currencies: 'usd',
        include_24hr_change: true
      },
      headers: { 'accept': 'application/json' }
    });

    Object.keys(priceState).forEach(id => {
      if (response.data[id]) {
        priceState[id].price = response.data[id].usd || priceState[id].price;
        priceState[id].change24h = response.data[id].usd_24h_change || priceState[id].change24h;
      }
    });

    console.log('[Socket Service] Live CoinGecko prices fetched successfully');
  } catch (err) {
    console.warn('[Socket Service Price Fetch Warning] Using cached rates due to API issue:', err.message);
  }
};

/**
 * Initialize Socket.io server
 * @param {Object} httpServer - The HTTP Server instance
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5174',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Send initial price state immediately upon connection
    socket.emit('price-update', priceState);

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Start polling CoinGecko every 15 seconds to stay fresh
  fetchLatestPrices();
  intervalId = setInterval(fetchLatestPrices, 15000);

  // In development, run a high-frequency simulation (every 1.5s) to animate price movements
  simulationId = setInterval(() => {
    if (!io) return;

    const simulatedUpdate = {};
    Object.keys(priceState).forEach(id => {
      // Simulate minor price fluctuation (-0.08% to +0.08%)
      const factor = 1 + (Math.random() * 0.0016 - 0.0008);
      priceState[id].price = parseFloat((priceState[id].price * factor).toFixed(2));
      
      simulatedUpdate[id] = {
        price: priceState[id].price,
        change24h: priceState[id].change24h,
        symbol: idToSymbol[id]
      };
    });

    io.emit('price-update', simulatedUpdate);
  }, 1500);

  console.log('[Socket.io] Real-time Price Streaming Service Initialized.');
};

/**
 * Close connections and intervals on shutdown
 */
export const closeSocket = () => {
  if (intervalId) clearInterval(intervalId);
  if (simulationId) clearInterval(simulationId);
  if (io) {
    io.close();
    console.log('[Socket.io] Real-time Price Streaming Service Closed.');
  }
};
