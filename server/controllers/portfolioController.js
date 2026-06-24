import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @route   GET /api/v1/portfolio
 * @desc    Get user portfolio holdings and cash balance
 * @access  Private
 */
export const getPortfolioState = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, 200, 'Portfolio state retrieved successfully', {
      cashUSD: user.cashUSD,
      holdings: user.holdings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/portfolio/trade
 * @desc    Place a BUY or SELL transaction order
 * @access  Private
 */
export const executeTrade = async (req, res, next) => {
  try {
    const { type, symbol, amount, price } = req.body;

    if (!type || !symbol || !amount || !price) {
      return errorResponse(res, 400, 'Please provide transaction type, asset symbol, amount, and price');
    }

    if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
      return errorResponse(res, 400, "Trade type must be either 'BUY' or 'SELL'");
    }

    const tradeType = type.toUpperCase();
    const assetSymbol = symbol.toUpperCase().trim();
    const tradeAmount = parseFloat(amount);
    const assetPrice = parseFloat(price);
    const totalCost = parseFloat((tradeAmount * assetPrice).toFixed(2));

    if (tradeAmount <= 0 || assetPrice <= 0) {
      return errorResponse(res, 400, 'Trade amount and price must be greater than zero');
    }

    const user = await User.findById(req.user._id);

    if (tradeType === 'BUY') {
      if (user.cashUSD < totalCost) {
        return errorResponse(res, 400, `Insufficient USD cash balance. Required: $${totalCost.toLocaleString()}, Available: $${user.cashUSD.toLocaleString()}`);
      }

      // Update cash
      user.cashUSD = parseFloat((user.cashUSD - totalCost).toFixed(2));

      // Update holdings
      const holdingsCopy = [...user.holdings];
      const index = holdingsCopy.findIndex(h => h.symbol === assetSymbol);

      if (index > -1) {
        const currentAmount = holdingsCopy[index].amount;
        const currentAvg = holdingsCopy[index].avgBuyPrice;
        const totalPreviousCost = currentAmount * currentAvg;
        const nextAmount = currentAmount + tradeAmount;
        
        holdingsCopy[index] = {
          symbol: assetSymbol,
          amount: nextAmount,
          avgBuyPrice: parseFloat(((totalPreviousCost + totalCost) / nextAmount).toFixed(2))
        };
      } else {
        holdingsCopy.push({
          symbol: assetSymbol,
          amount: tradeAmount,
          avgBuyPrice: assetPrice
        });
      }
      user.holdings = holdingsCopy;

    } else { // SELL
      const holding = user.holdings.find(h => h.symbol === assetSymbol);
      if (!holding || holding.amount < tradeAmount) {
        return errorResponse(res, 400, `Insufficient holdings for ${assetSymbol}. Available: ${holding ? holding.amount : 0}, Required: ${tradeAmount}`);
      }

      // Update cash
      user.cashUSD = parseFloat((user.cashUSD + totalCost).toFixed(2));

      // Update holdings
      let holdingsCopy = [...user.holdings];
      const index = holdingsCopy.findIndex(h => h.symbol === assetSymbol);
      const remainingAmount = holdingsCopy[index].amount - tradeAmount;

      if (remainingAmount <= 0.0000001) { // Floating point safeguard
        // Remove holding entirely
        holdingsCopy = holdingsCopy.filter(h => h.symbol !== assetSymbol);
      } else {
        holdingsCopy[index] = {
          ...holdingsCopy[index],
          amount: remainingAmount
        };
      }
      user.holdings = holdingsCopy;
    }

    // Record Transaction history ledger entry
    const newTransaction = await Transaction.create({
      userId: user._id,
      type: tradeType,
      symbol: assetSymbol,
      amount: tradeAmount,
      price: assetPrice
    });

    await user.save();

    return successResponse(res, 201, `Simulated trade order ${tradeType} for ${tradeAmount} ${assetSymbol} completed`, {
      cashUSD: user.cashUSD,
      holdings: user.holdings,
      transaction: newTransaction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/portfolio/deposit
 * @desc    Simulate cash deposit into account
 * @access  Private
 */
export const depositCash = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const cashAmount = parseFloat(amount);

    if (!cashAmount || cashAmount <= 0) {
      return errorResponse(res, 400, 'Please enter a positive cash amount to deposit');
    }

    const user = await User.findById(req.user._id);
    user.cashUSD = parseFloat((user.cashUSD + cashAmount).toFixed(2));

    const newTx = await Transaction.create({
      userId: user._id,
      type: 'DEPOSIT',
      symbol: 'USD',
      amount: cashAmount,
      price: 1.0
    });

    await user.save();

    return successResponse(res, 201, `USD Deposit of $${cashAmount.toLocaleString()} successful`, {
      cashUSD: user.cashUSD,
      transaction: newTx
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/portfolio/withdraw
 * @desc    Simulate cash withdrawal from account
 * @access  Private
 */
export const withdrawCash = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const cashAmount = parseFloat(amount);

    if (!cashAmount || cashAmount <= 0) {
      return errorResponse(res, 400, 'Please enter a positive cash amount to withdraw');
    }

    const user = await User.findById(req.user._id);

    if (user.cashUSD < cashAmount) {
      return errorResponse(res, 400, `Insufficient cash balance. Available: $${user.cashUSD.toLocaleString()}, Requested: $${cashAmount.toLocaleString()}`);
    }

    user.cashUSD = parseFloat((user.cashUSD - cashAmount).toFixed(2));

    const newTx = await Transaction.create({
      userId: user._id,
      type: 'WITHDRAW',
      symbol: 'USD',
      amount: cashAmount,
      price: 1.0
    });

    await user.save();

    return successResponse(res, 201, `USD Withdrawal of $${cashAmount.toLocaleString()} successful`, {
      cashUSD: user.cashUSD,
      transaction: newTx
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/portfolio/transactions
 * @desc    Get user transaction history ledger
 * @access  Private
 */
export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
    return successResponse(res, 200, 'Transaction ledger logs retrieved successfully', transactions);
  } catch (error) {
    next(error);
  }
};
