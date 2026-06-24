import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @route   GET /api/v1/watchlist
 * @desc    Get current user's watchlist symbols
 * @access  Private
 */
export const getWatchlist = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Watchlist retrieved successfully', req.user.watchlist);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/watchlist/toggle
 * @desc    Add or remove a symbol from watchlist
 * @access  Private
 */
export const toggleWatchlistSymbol = async (req, res, next) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return errorResponse(res, 400, 'Please provide an asset symbol to toggle');
    }

    const formattedSymbol = symbol.toUpperCase().trim();
    const user = await User.findById(req.user._id);

    const index = user.watchlist.indexOf(formattedSymbol);
    let action = 'added';

    if (index > -1) {
      // Symbol exists, remove it
      user.watchlist.splice(index, 1);
      action = 'removed';
    } else {
      // Symbol does not exist, add it
      user.watchlist.push(formattedSymbol);
    }

    await user.save();

    return successResponse(res, 200, `Symbol ${formattedSymbol} successfully ${action} watchlist`, user.watchlist);
  } catch (error) {
    next(error);
  }
};
