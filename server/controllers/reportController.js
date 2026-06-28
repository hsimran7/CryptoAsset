import axios from 'axios';
import Report from '../models/Report.js';
import PortfolioAsset from '../models/Portfolio.js';
import AIAnalysis from '../models/AIAnalysis.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/* ─── Helpers ─────────────────────────────────────────── */

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const fmtPct = (n) => `${(n || 0) >= 0 ? '+' : ''}${parseFloat(n || 0).toFixed(2)}%`;

/** Fetches live prices from CoinGecko for given coinIds */
const fetchLivePrices = async (coinIds) => {
  if (!coinIds.length) return {};
  try {
    const ids = [...new Set(coinIds)].join(',');
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids, vs_currencies: 'usd', include_24hr_change: 'true' },
      headers: { accept: 'application/json' },
      timeout: 5000
    });
    return res.data || {};
  } catch {
    return {};
  }
};

/** Build a rich portfolio data bundle (used by both PDF and CSV routes) */
const buildPortfolioBundle = async (userId) => {
  const [user, assets, lastAnalysis] = await Promise.all([
    User.findById(userId).select('username email createdAt').lean(),
    PortfolioAsset.find({ userId }).lean(),
    AIAnalysis.findOne({ userId }).sort({ createdAt: -1 }).lean()
  ]);

  const priceMap = await fetchLivePrices(assets.map(a => a.coinId));

  const enriched = assets.map(a => {
    const livePrice = priceMap[a.coinId]?.usd || a.buyPrice;
    const valueUSD  = a.quantity * livePrice;
    const invested  = a.quantity * a.buyPrice;
    const pnl       = valueUSD - invested;
    const pnlPct    = invested > 0 ? (pnl / invested) * 100 : 0;
    const alloc     = 0; // will be patched below
    return { ...a, livePrice, valueUSD, invested, pnl, pnlPct, alloc };
  });

  const totalValue    = enriched.reduce((s, a) => s + a.valueUSD, 0);
  const totalInvested = enriched.reduce((s, a) => s + a.invested, 0);
  const totalPnL      = totalValue - totalInvested;
  const totalPnLPct   = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Patch allocation %
  enriched.forEach(a => { a.alloc = totalValue > 0 ? (a.valueUSD / totalValue) * 100 : 0; });

  return { user, assets: enriched, totalValue, totalInvested, totalPnL, totalPnLPct, lastAnalysis };
};

/* ════════════════════════════════════════════════════════
   CSV GENERATOR
   ════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/reports/csv
 * @desc    Stream portfolio data as a CSV file
 * @access  Private
 */
export const downloadCSV = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { user, assets, totalValue, totalInvested, totalPnL, totalPnLPct } = await buildPortfolioBundle(userId);

    if (!assets.length) {
      return errorResponse(res, 400, 'No portfolio assets found. Please add holdings before exporting.');
    }

    // ── Build CSV rows ──
    const escapeCSV = (val) => {
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const rows = [
      // Report header block
      ['CryptoVision AI — Portfolio Report'],
      [`Generated For: ${escapeCSV(user?.username || 'User')}`],
      [`Email: ${escapeCSV(user?.email || '')}`],
      [`Report Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`],
      [],
      ['PORTFOLIO SUMMARY'],
      ['Total Portfolio Value', fmt(totalValue)],
      ['Total Amount Invested', fmt(totalInvested)],
      ['Total Profit / Loss', fmt(totalPnL)],
      ['Overall ROI', fmtPct(totalPnLPct)],
      [],
      // Asset table header
      ['ASSET BREAKDOWN'],
      [
        'Coin Name', 'Symbol', 'Quantity', 'Buy Price (USD)',
        'Current Price (USD)', 'Value (USD)', 'Invested (USD)',
        'P&L (USD)', 'P&L (%)', 'Allocation (%)'
      ],
      // Asset rows
      ...assets.map(a => [
        escapeCSV(a.coinName),
        escapeCSV(a.symbol),
        a.quantity,
        fmt(a.buyPrice),
        fmt(a.livePrice),
        fmt(a.valueUSD),
        fmt(a.invested),
        fmt(a.pnl),
        fmtPct(a.pnlPct),
        `${a.alloc.toFixed(2)}%`
      ]),
      [],
      ['DISCLAIMER'],
      ['This report is generated for educational and informational purposes only.'],
      ['It does not constitute financial investment or tax advice.'],
      ['Always consult a licensed financial advisor before making investment decisions.']
    ];

    const csvContent = rows.map(row => Array.isArray(row) ? row.join(',') : row).join('\r\n');
    const fileName = `CryptoVision_Portfolio_${new Date().toISOString().slice(0, 10)}.csv`;

    // Log the report generation
    await Report.create({ userId, reportType: 'CSV', fileName });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.status(200).send('\uFEFF' + csvContent); // BOM for Excel UTF-8 compat

  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════════════
   PDF DATA ENDPOINT
   Returns structured JSON that the client uses to render the PDF via jsPDF.
   This avoids heavy PDF libraries on the server and keeps rendering fast.
   ════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/reports/pdf
 * @desc    Return structured portfolio data payload for client-side PDF generation
 * @access  Private
 */
export const getPDFData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bundle = await buildPortfolioBundle(userId);

    if (!bundle.assets.length) {
      return errorResponse(res, 400, 'No portfolio assets found. Please add holdings before generating a report.');
    }

    // Log the report generation
    const fileName = `CryptoVision_Portfolio_${new Date().toISOString().slice(0, 10)}.pdf`;
    await Report.create({ userId, reportType: 'PDF', fileName });

    return successResponse(res, 200, 'PDF data prepared successfully.', { ...bundle, fileName });

  } catch (err) {
    next(err);
  }
};

/* ════════════════════════════════════════════════════════
   REPORT HISTORY
   ════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/reports/history
 * @desc    Get the user's report generation history
 * @access  Private
 */
export const getReportHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await Report.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    return successResponse(res, 200, 'Report history retrieved.', { history });
  } catch (err) {
    next(err);
  }
};
