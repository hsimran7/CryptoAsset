import { errorResponse } from '../utils/apiResponse.js';

/**
 * Handles unrecognized routing requests (404 Not Found)
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route Not Found - '${req.originalUrl}' does not exist on this server.`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global Express exception handling interceptor
 */
export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose CastError (invalid MongoDB ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource query failed: invalid ID format '${err.value}'`;
  }

  // Handle Mongoose duplicate key constraint validation (e.g. unique field collision)
  if (err.code === 11000) {
    statusCode = 400;
    const fieldName = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate resource collision: '${fieldName}' already exists`;
  }

  // Handle Mongoose document validation failures
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Data Validation Failed';
    errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
  }

  // Console output error details for debugging (development mode only)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error Middleware] Caught error:`, err);
    // Expose stack trace in development
    errors = errors || { stack: err.stack };
  }

  return errorResponse(res, statusCode, message, errors);
};
