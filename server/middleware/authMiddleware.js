import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Middleware wrapper to protect routes and require JWT auth
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from format: Bearer <JWT>
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB, excluding password
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return errorResponse(res, 401, 'Authorization Failed: User account no longer exists');
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware Error] token verification failed:', error.message);
      return errorResponse(res, 401, 'Authorization Failed: invalid token signature or token expired');
    }
  }

  if (!token) {
    return errorResponse(res, 401, 'Authorization Failed: No bearer token provided');
  }
};

/**
 * Middleware wrapper restricting endpoints only to user role: ADMIN
 */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return errorResponse(res, 403, 'Permission Denied: Admin privileges required');
  }
};
