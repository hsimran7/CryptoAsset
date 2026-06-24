import { errorResponse } from '../utils/apiResponse.js';

/**
 * Reusable middleware to validate request bodies using Zod schemas
 * @param {z.ZodSchema} schema - Zod validation schema
 */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors) {
      // Map and format Zod validation errors
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      // Return 400 Bad Request with details
      return errorResponse(res, 400, 'Input validation failed', formattedErrors);
    }
    
    next(error);
  }
};
