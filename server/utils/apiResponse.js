/**
 * Utility helper functions to send uniform JSON responses
 */

/**
 * Sends a successful API response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP Status Code
 * @param {String} message - Human-readable success message
 * @param {Object|Array} data - Payload data object or array
 */
export const successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Sends an error API response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP Status Code
 * @param {String} message - Error category/message summary
 * @param {Object|Array|null} errors - Array of validation errors or detail message
 */
export const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
