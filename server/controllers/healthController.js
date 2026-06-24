import mongoose from 'mongoose';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Endpoint controller to fetch application status and Mongoose connection state
 */
export const getHealthStatus = async (req, res, next) => {
  try {
    const readyState = mongoose.connection.readyState;
    
    const dbConnectionStates = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };

    const isConnected = readyState === 1;
    
    const statusReport = {
      status: isConnected ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || 'production',
      database: {
        state: dbConnectionStates[readyState] || 'Unknown',
        connected: isConnected
      },
      system: {
        platform: process.platform,
        memoryUsage: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
        }
      }
    };

    // Return 503 Service Unavailable if the Mongoose DB state is disconnected
    if (!isConnected) {
      return res.status(503).json({
        success: false,
        message: 'System is degraded: database connection offline',
        data: statusReport
      });
    }

    return successResponse(res, 200, 'CryptoVision AI API Gateway is fully operational', statusReport);
  } catch (error) {
    next(error);
  }
};
