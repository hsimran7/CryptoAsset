import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import passport from 'passport';

// Load environment variables
dotenv.config();

// Configuration & Middlewares
import connectDB from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import './config/passport.js';

// Route files
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import assetPortfolioRoutes from './routes/assetPortfolioRoutes.js';
import assetWatchlistRoutes from './routes/assetWatchlistRoutes.js';
import alertsRoutes from './routes/alertsRoutes.js';
import coinRoutes from './routes/coinRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initSocket, closeSocket } from './utils/socketService.js';

// Connect to MongoDB
connectDB();

const app = express();

// Security Headers (Helmet)
app.use(helmet());

// Initialize Passport
app.use(passport.initialize());

// Standard Request Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Enable CORS with dynamic settings
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting on API
app.use('/api', apiLimiter);

// Mount Application Routes
app.use('/api/coins', coinRoutes);
app.use('/api/v1/coins', coinRoutes);
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/portfolio', assetPortfolioRoutes);
app.use('/api/v1/portfolio-assets', assetPortfolioRoutes);
app.use('/api/watchlist', assetWatchlistRoutes);
app.use('/api/v1/watchlist-items', assetWatchlistRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1/admin', adminRoutes);

// Base route fallback
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the CryptoVision AI API Gateway. Use /api/v1/health for health checks.'
  });
});

// Fallback Route (404 Handler)
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Listen Port setup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] CryptoVision AI Backend running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});
initSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection Error] details: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful Shutdown on termination signals
const shutdownGracefully = (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    closeSocket();
    try {
      await mongoose.connection.close();
      console.log('[Database] MongoDB connection closed.');
      process.exit(0);
    } catch (dbErr) {
      console.error(`[Database Disconnect Error] Failed during shutdown: ${dbErr.message}`);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => shutdownGracefully('SIGINT'));
process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
