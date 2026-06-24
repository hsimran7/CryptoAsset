const API_BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Perform a request to the backend API
 * @param {string} endpoint - API route (e.g. '/auth/login')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cv_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    ...config
  });

  let responseData;
  try {
    responseData = await response.json();
  } catch (err) {
    responseData = { success: false, message: 'Response parsing failed' };
  }

  if (!response.ok) {
    throw new Error(responseData.message || 'API request failed');
  }

  return responseData;
};
