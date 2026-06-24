import Alert from '../models/Alert.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @route   GET /api/v1/alerts
 * @desc    Get user's configured price alert rules
 * @access  Private
 */
export const getAlertRules = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, 200, 'Price alert rules retrieved successfully', alerts);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/alerts
 * @desc    Create a new price alert rule
 * @access  Private
 */
export const createAlert = async (req, res, next) => {
  try {
    const { symbol, type, value } = req.body;

    if (!symbol || !type || !value) {
      return errorResponse(res, 400, 'Please enter asset symbol, trigger condition type, and target price value');
    }

    if (!['ABOVE', 'BELOW'].includes(type.toUpperCase())) {
      return errorResponse(res, 400, "Alert trigger condition must be either 'ABOVE' or 'BELOW'");
    }

    const alertValue = parseFloat(value);
    if (alertValue <= 0) {
      return errorResponse(res, 400, 'Target alert value price must be greater than zero');
    }

    const newAlert = await Alert.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase().trim(),
      type: type.toUpperCase(),
      value: alertValue
    });

    return successResponse(res, 201, `Price alert rule created for ${newAlert.symbol} at $${alertValue.toLocaleString()}`, newAlert);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/alerts/:id/toggle
 * @desc    Toggle alert status (isActive)
 * @access  Private
 */
export const toggleAlert = async (req, res, next) => {
  try {
    const alertId = req.params.id;
    const alert = await Alert.findOne({ _id: alertId, userId: req.user._id });

    if (!alert) {
      return errorResponse(res, 404, 'Alert rule not found or unauthorized');
    }

    alert.isActive = !alert.isActive;
    await alert.save();

    const action = alert.isActive ? 'activated' : 'deactivated';
    return successResponse(res, 200, `Alert rule successfully ${action}`, alert);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/alerts/:id
 * @desc    Delete a price alert rule
 * @access  Private
 */
export const deleteAlert = async (req, res, next) => {
  try {
    const alertId = req.params.id;
    const alert = await Alert.findOneAndDelete({ _id: alertId, userId: req.user._id });

    if (!alert) {
      return errorResponse(res, 404, 'Alert rule not found or unauthorized');
    }

    return successResponse(res, 200, `Alert rule for ${alert.symbol} deleted successfully`, { id: alert._id });
  } catch (error) {
    next(error);
  }
};
