import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import AIChat from '../models/AIChat.js';
import AIAnalysis from '../models/AIAnalysis.js';
import PortfolioAsset from '../models/Portfolio.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Cache for CoinGecko markets context to protect against rate limits
let marketContextCache = {
  data: null,
  timestamp: 0
};
const CACHE_DURATION = 60 * 1000; // 60 seconds

/**
 * Fetches market data for context injection
 */
const getMarketContext = async () => {
  const now = Date.now();
  if (marketContextCache.data && now - marketContextCache.timestamp < CACHE_DURATION) {
    return marketContextCache.data;
  }

  try {
    console.log('[AI Context] Fetching live market context...');
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 15,
        page: 1,
        price_change_percentage: '24h',
        locale: 'en'
      },
      headers: {
        'accept': 'application/json'
      },
      timeout: 4000
    });

    if (Array.isArray(response.data)) {
      const summaryList = response.data.map(c => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        change24h: c.price_change_percentage_24h,
        rank: c.market_cap_rank
      }));
      marketContextCache.data = summaryList;
      marketContextCache.timestamp = now;
      return summaryList;
    }
  } catch (err) {
    console.warn('[AI Context Warning] Failed to fetch live markets context:', err.message);
  }

  return marketContextCache.data; // Return stale cache or null if none
};

/**
 * Generates high-fidelity mock AI answers when Gemini API Key is missing or invalid
 */
const generateSimulatedResponse = (question, mode) => {
  const cleaned = question.toLowerCase();
  let answer = '';

  if (cleaned.includes('what is bitcoin') || cleaned.includes('explain bitcoin')) {
    if (mode === 'beginner') {
      answer = "Bitcoin is digital money. Imagine a giant, shared ledger book that everyone in the world can see, but nobody can cheat or change. This ledger is called the blockchain. Unlike paper dollars printed by governments, Bitcoin is created and held electronically on a global network of computers. No single bank or company controls it, meaning you are in complete control of your own funds.";
    } else {
      answer = "Bitcoin (BTC) is a decentralized peer-to-peer digital currency and network operating on a Proof-of-Work (PoW) consensus mechanism. Transactions are bundled into blocks and linked cryptographically on an immutable ledger. Supply is algorithmically capped at 21 million coins, with emission rates halved every 210,000 blocks (approximately every 4 years). It functions as a global decentralized ledger and synthetic digital collateral.";
    }
  } else if (cleaned.includes('ethereum') || cleaned.includes('ether')) {
    if (mode === 'beginner') {
      answer = "Ethereum is more than digital money; it's like a giant global playground for computer programs. While Bitcoin is like a digital vault to store gold, Ethereum is like a global operating system that can run automatic contracts, games, and financial applications without a central boss or server. These automatic programs are called 'smart contracts'.";
    } else {
      answer = "Ethereum (ETH) is a decentralized, Turing-complete virtual machine and smart contract execution platform. It utilizes a Proof-of-Stake (PoS) consensus protocol following the Merge, where validators lock up ETH to secure the chain. The network supports advanced decentralized applications (dApps), decentralized finance (DeFi) protocols, ERC standards (like ERC-20 and ERC-721), and gas fees are paid in native ETH.";
    }
  } else if (cleaned.includes('falling') || cleaned.includes('down') || cleaned.includes('drop') || cleaned.includes('dump') || cleaned.includes('why is')) {
    answer = "Market movements are driven by complex dynamics. Short-term volatility is often caused by macro factors such as changes in interest rates, regulatory developments, and liquidations of leveraged derivatives. Analyzing order books and technical support lines reveals that consolidation patterns are typical in crypto cycles. Focus on long-term fundamental indicators rather than daily fluctuations.";
  } else if (cleaned.includes('compare') || cleaned.includes('difference between')) {
    if (mode === 'beginner') {
      answer = "Think of Bitcoin as 'digital gold'—it's designed to be a safe vault to store value. Think of Ethereum as 'digital electricity'—it's designed to run programmable programs and apps. Bitcoin prioritizes simple, secure digital cash; Ethereum prioritizes complex, automated applications.";
    } else {
      answer = "Bitcoin (BTC) is primarily optimized to serve as a decentralized store of value (digital gold) with a strict hard-capped supply of 21 million. Ethereum (ETH) is optimized as a decentralized smart contract execution framework. While Bitcoin values simplicity and deep consensus stability, Ethereum prioritizes state programmability, hosting token standards (ERC-20, NFT), and executing complex financial state transitions.";
    }
  } else if (cleaned.includes('trend') || cleaned.includes('indicator') || cleaned.includes('rsi')) {
    answer = "Analyzing the current technical trend, major assets are trading in consolidation ranges. Momentum indicators like the Relative Strength Index (RSI) show neutral ranges around 50-55. The Exponential Moving Averages (EMA 50 and 200) suggest the macro bullish structural support is holding, but a volume breakout above local resistance thresholds is required to confirm bullish continuation.";
  } else {
    answer = `Analyzing your query regarding "${question}"... Crypto markets are consolidating in a range. Major support lines are holding, and volume is steady. For ${mode} level analysis, I recommend focusing on asset diversification and dollar-cost averaging strategies rather than speculating on immediate intraday margins.`;
  }

  return `${answer}\n\n[Simulation Mode - Configure GEMINI_API_KEY in server/.env for live Gemini intelligence]\n\nDisclaimer: This is educational information, not financial advice.`;
};

/**
 * @route   POST /api/ai/chat
 * @desc    Submit a question to the AI assistant
 * @access  Private
 */
export const askAssistant = async (req, res, next) => {
  try {
    const { question, mode = 'beginner' } = req.body;
    if (!question || !question.trim()) {
      return errorResponse(res, 400, 'Please provide a question.');
    }

    const userId = req.user.id;

    // 1. Gather Market Context
    const marketList = await getMarketContext();
    let marketContextText = 'No live market context available.';
    let contextCoins = [];

    if (marketList && marketList.length > 0) {
      marketContextText = 'Real-time market context for the top cryptocurrencies:\n';
      marketList.forEach(c => {
        marketContextText += `- ${c.name} (${c.symbol}): Price $${c.price.toLocaleString()}, 24h Change: ${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(2)}%, Rank: #${c.rank}\n`;
      });

      // Detect context coins from question text
      const questionLower = question.toLowerCase();
      contextCoins = marketList
        .filter(c => questionLower.includes(c.id) || questionLower.includes(c.name.toLowerCase()) || questionLower.includes(c.symbol.toLowerCase()))
        .map(c => c.id);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey.includes('placeholder') || apiKey.trim() === '';

    let aiAnswer = '';

    if (isMock) {
      // Run fallback simulation
      aiAnswer = generateSimulatedResponse(question, mode);
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemInstructions = `You are "CryptoVision AI Co-Pilot", a premium fintech co-pilot and terminal assistant.
Your operational parameters:
1. Explain topics based on the chosen explanation mode:
   - "beginner" mode: Use simple analogies, avoid complex math/jargon, explain fundamentals clearly.
   - "pro" mode: Use professional trading concepts, reference technical indicators (RSI, MACD, support/resistance lines), order books, and market dynamics.
2. Real-time market context is provided to you. Use it to answer questions about current prices, performance, or market cap rankings:
${marketContextText}
3. CRITICAL: You must NOT under any circumstances give direct financial advice, trading signals, or buy/sell recommendations (e.g. do not say "buy BTC now" or "sell ETH immediately"). Offer educational analysis, risk assessment, and technical observations.
4. Every response MUST end with this exact disclaimer block on a new line:
   "Disclaimer: This is educational information, not financial advice."
`;

        const prompt = `${systemInstructions}\n\nUser Question: ${question}\nExplanation Mode: ${mode}`;
        
        console.log('[Gemini API] Requesting generative assistant response...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiAnswer = response.text();

        // Safety fallback to append disclaimer if model missed it
        const disclaimer = 'Disclaimer: This is educational information, not financial advice.';
        if (!aiAnswer.includes(disclaimer)) {
          aiAnswer = `${aiAnswer.trim()}\n\n${disclaimer}`;
        }
      } catch (geminiErr) {
        console.error('[Gemini API Error] Failed calling API, falling back to simulation:', geminiErr.message);
        aiAnswer = generateSimulatedResponse(question, mode);
      }
    }

    // 2. Persist in database
    const chatEntry = await AIChat.create({
      userId,
      question,
      answer: aiAnswer,
      contextCoins
    });

    return successResponse(res, 201, 'AI analysis generated successfully.', {
      chat: {
        _id: chatEntry._id,
        question: chatEntry.question,
        answer: chatEntry.answer,
        contextCoins: chatEntry.contextCoins,
        createdAt: chatEntry.createdAt
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/ai/chat-history
 * @desc    Get user's chat history
 * @access  Private
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await AIChat.find({ userId }).sort({ createdAt: 1 });

    return successResponse(res, 200, 'Chat history retrieved successfully.', {
      history
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/ai/chat-history
 * @desc    Clear user's chat history
 * @access  Private
 */
export const clearChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await AIChat.deleteMany({ userId });

    return successResponse(res, 200, 'Chat history cleared successfully.', {});
  } catch (err) {
    next(err);
  }
};

/* =====================================================================
   PORTFOLIO ANALYZER HELPERS
   ===================================================================== */

/**
 * Rule-based fallback portfolio auditor.
 * Computes risk & diversification scores, and narrative items from raw asset data.
 */
const buildFallbackAnalysis = (enrichedAssets, totalValue) => {
  const count = enrichedAssets.length;
  
  // --- Diversification Score ---
  // More unique coins + more sectors = better score (max 100)
  const uniqueCoins = new Set(enrichedAssets.map(a => a.coinId)).size;
  const diversificationScore = Math.min(100, Math.round(
    (uniqueCoins / 8) * 50 +               // up to 50 pts for breadth
    (Math.min(count, 6) / 6) * 30 +        // up to 30 pts for holding count
    (totalValue > 1000 ? 20 : (totalValue / 1000) * 20) // up to 20 pts for total value
  ));

  // --- Risk Score (higher = more risk) ---
  // Concentrated bets + high volatility assets increase risk
  const topAssetWeight = enrichedAssets.length > 0
    ? Math.max(...enrichedAssets.map(a => (a.valueUSD / totalValue) * 100))
    : 100;

  let riskScore = Math.min(100, Math.round(
    topAssetWeight * 0.5 +                 // concentration risk
    (count < 3 ? 30 : count < 5 ? 15 : 5) + // under-diversification penalty
    20                                      // baseline crypto market risk
  ));
  riskScore = Math.max(10, riskScore);

  // --- Strengths ---
  const strengths = [];
  if (uniqueCoins >= 3) strengths.push('Your portfolio holds multiple distinct assets, reducing single-coin concentration risk.');
  if (topAssetWeight < 60) strengths.push('No single asset dominates more than 60% of your holdings, which is a healthy distribution pattern.');
  if (totalValue > 0) strengths.push('You have active crypto exposure, positioning yourself to participate in potential long-term market growth.');
  if (enrichedAssets.some(a => ['bitcoin', 'ethereum'].includes(a.coinId))) {
    strengths.push('Holding major market cap leaders like BTC or ETH provides a more stable foundation compared to smaller-cap assets.');
  }
  if (strengths.length === 0) strengths.push('You have taken the first step into crypto asset participation.');

  // --- Weaknesses ---
  const weaknesses = [];
  if (topAssetWeight > 70) {
    const topAsset = enrichedAssets.find(a => (a.valueUSD / totalValue) * 100 === topAssetWeight);
    weaknesses.push(`High concentration: ${topAsset ? topAsset.symbol : 'one asset'} makes up ${topAssetWeight.toFixed(0)}% of your portfolio. Single-asset concentration amplifies risk during market corrections.`);
  }
  if (count < 3) weaknesses.push('Low asset count (fewer than 3 coins) limits diversification benefits across market cycles.');
  if (!enrichedAssets.some(a => ['bitcoin', 'ethereum'].includes(a.coinId))) {
    weaknesses.push('Portfolio lacks established large-cap anchors (BTC or ETH), which typically exhibit lower volatility relative to smaller altcoins.');
  }
  if (weaknesses.length === 0) weaknesses.push('No critical structural weaknesses detected in the current snapshot. Continue monitoring concentration levels as market conditions change.');

  // --- Suggestions ---
  const suggestions = [];
  if (count < 5) suggestions.push('Consider researching additional asset categories (e.g., Layer 2, DeFi, or infrastructure tokens) to broaden exposure across the crypto ecosystem.');
  if (topAssetWeight > 50) suggestions.push('Explore gradual rebalancing over time to reduce heavy concentration in a single asset, which can help stabilize overall portfolio volatility.');
  suggestions.push('Setting price range alerts for your major holdings helps maintain awareness of key support and resistance levels without constant monitoring.');
  suggestions.push('Reviewing your portfolio allocation periodically (every 30-90 days) aligns your holdings with evolving market conditions and your own risk tolerance.');

  // --- Summary ---
  const riskLabel = riskScore > 70 ? 'high' : riskScore > 40 ? 'moderate' : 'low';
  const divLabel = diversificationScore > 70 ? 'well-diversified' : diversificationScore > 40 ? 'moderately diversified' : 'concentrated';
  const summary = `Your crypto portfolio contains ${count} asset${count !== 1 ? 's' : ''} with a total educational valuation of $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}. The portfolio exhibits ${riskLabel} risk characteristics and appears ${divLabel} across the evaluated holdings. The diversification score of ${diversificationScore}/100 reflects your asset spread, while the risk score of ${riskScore}/100 accounts for concentration patterns and inherent crypto market volatility. This analysis is educational in nature and should not be used as a basis for financial decisions. Disclaimer: This is educational information, not financial advice.`;

  return { riskScore, diversificationScore, strengths, weaknesses, suggestions, summary };
};

/**
 * @route   POST /api/ai/analyze-portfolio
 * @desc    Run a Gemini-powered educational portfolio risk audit
 * @access  Private
 */
export const analyzePortfolio = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user's portfolio assets from DB
    const assets = await PortfolioAsset.find({ userId });
    if (!assets || assets.length === 0) {
      return errorResponse(res, 400, 'Your portfolio is empty. Please add asset entries in the Portfolio page before running an analysis.');
    }

    // 2. Fetch live prices for enrichment
    const coinIds = [...new Set(assets.map(a => a.coinId))].join(',');
    let priceMap = {};

    try {
      const priceRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: coinIds, vs_currencies: 'usd', include_24hr_change: 'true' },
        headers: { accept: 'application/json' },
        timeout: 5000
      });
      priceMap = priceRes.data;
    } catch (priceErr) {
      console.warn('[Portfolio Analyzer] Price fetch warning:', priceErr.message, '— using buy prices as fallback.');
    }

    // 3. Build enriched snapshot
    const enrichedAssets = assets.map(a => {
      const livePrice = priceMap[a.coinId]?.usd || a.buyPrice;
      const change24h = priceMap[a.coinId]?.usd_24h_change || 0;
      const valueUSD = a.quantity * livePrice;
      const investedUSD = a.quantity * a.buyPrice;
      return {
        coinId: a.coinId,
        coinName: a.coinName,
        symbol: a.symbol,
        quantity: a.quantity,
        buyPrice: a.buyPrice,
        currentPrice: livePrice,
        change24h: parseFloat(change24h.toFixed(2)),
        valueUSD: parseFloat(valueUSD.toFixed(2)),
        investedUSD: parseFloat(investedUSD.toFixed(2)),
        pnlUSD: parseFloat((valueUSD - investedUSD).toFixed(2)),
        pnlPct: investedUSD > 0 ? parseFloat((((valueUSD - investedUSD) / investedUSD) * 100).toFixed(2)) : 0
      };
    });

    const totalValue = enrichedAssets.reduce((s, a) => s + a.valueUSD, 0);

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey.includes('placeholder') || apiKey.trim() === '';

    let riskScore, diversificationScore, strengths, weaknesses, suggestions, summary;

    if (isMock) {
      // Use rule-based local auditor
      console.log('[Portfolio Analyzer] No API key — using rule-based fallback auditor.');
      ({ riskScore, diversificationScore, strengths, weaknesses, suggestions, summary } = buildFallbackAnalysis(enrichedAssets, totalValue));
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const assetList = enrichedAssets.map(a =>
          `- ${a.coinName} (${a.symbol}): Qty=${a.quantity}, Paid=$${a.buyPrice}, Now=$${a.currentPrice}, Value=$${a.valueUSD.toFixed(2)}, PnL=${a.pnlPct >= 0 ? '+' : ''}${a.pnlPct}%, 24h=${a.change24h >= 0 ? '+' : ''}${a.change24h}%`
        ).join('\n');

        const geminiPrompt = `You are CryptoVision AI Co-Pilot — an educational crypto portfolio auditor.
RULES:
- Do NOT give explicit buy/sell/trade advice.
- Use educational, risk-awareness language only.
- All insights must be beginner-friendly.
- End every textual field with: "Disclaimer: This is educational information, not financial advice."

The user holds the following crypto assets (live prices shown):
${assetList}
Total estimated portfolio value: $${totalValue.toFixed(2)}

Respond ONLY with valid JSON in this exact schema. No markdown, no code fences, no explanation outside the JSON:
{
  "riskScore": <integer 0-100, where 100 = extremely high risk>,
  "diversificationScore": <integer 0-100, where 100 = perfectly diversified>,
  "strengths": [<3-4 educational strength statements as strings>],
  "weaknesses": [<2-4 educational weakness or risk-awareness statements as strings>],
  "suggestions": [<3-4 educational, non-advisory improvement ideas as strings>],
  "summary": "<2-3 sentence beginner-friendly portfolio summary ending with disclaimer>"
}`;

        console.log('[Gemini API] Requesting portfolio analysis...');
        const result = await model.generateContent(geminiPrompt);
        const rawText = result.response.text().trim();

        // Strip markdown code fences if present
        const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        riskScore = Math.min(100, Math.max(0, parseInt(parsed.riskScore) || 50));
        diversificationScore = Math.min(100, Math.max(0, parseInt(parsed.diversificationScore) || 50));
        strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
        weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
        suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
        summary = parsed.summary || '';

        const disclaimer = 'Disclaimer: This is educational information, not financial advice.';
        if (!summary.includes(disclaimer)) summary += `\n\n${disclaimer}`;

      } catch (geminiErr) {
        console.error('[Gemini API Error] Falling back to rule-based auditor:', geminiErr.message);
        ({ riskScore, diversificationScore, strengths, weaknesses, suggestions, summary } = buildFallbackAnalysis(enrichedAssets, totalValue));
      }
    }

    // 4. Persist analysis record
    const analysis = await AIAnalysis.create({
      userId,
      portfolioSnapshot: enrichedAssets,
      riskScore,
      diversificationScore,
      strengths,
      weaknesses,
      suggestions,
      summary
    });

    return successResponse(res, 201, 'Portfolio analysis generated successfully.', { analysis });

  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/ai/analysis-history
 * @desc    Get user's portfolio analysis history
 * @access  Private
 */
export const getAnalysisHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const history = await AIAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(20);
    return successResponse(res, 200, 'Analysis history retrieved successfully.', { history });
  } catch (err) {
    next(err);
  }
};

/* =====================================================================
   COIN COMPARISON
   ===================================================================== */

/**
 * Fetches essential coin data from CoinGecko for comparison.
 * Returns a flat object with price, market cap, volume, change24h, etc.
 */
const fetchCoinForComparison = async (coinId) => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
      params: { localization: false, tickers: false, market_data: true, community_data: true, developer_data: false, sparkline: false },
      headers: { accept: 'application/json' },
      timeout: 7000
    });
    const d = response.data;
    const md = d.market_data || {};

    return {
      id:                 d.id,
      name:              d.name,
      symbol:            d.symbol?.toUpperCase(),
      image:             d.image?.large || '',
      rank:              d.market_cap_rank || 0,
      price:             md.current_price?.usd || 0,
      change24h:         md.price_change_percentage_24h || 0,
      change7d:          md.price_change_percentage_7d  || 0,
      change30d:         md.price_change_percentage_30d || 0,
      marketCap:         md.market_cap?.usd  || 0,
      volume24h:         md.total_volume?.usd || 0,
      circulatingSupply: md.circulating_supply || 0,
      totalSupply:       md.total_supply || md.max_supply || 0,
      ath:               md.ath?.usd || 0,
      atl:               md.atl?.usd || 0,
      athDate:           md.ath_date?.usd || '',
      description:       (d.description?.en || '').replace(/<[^>]*>/g, '').slice(0, 400),
      twitterFollowers:  d.community_data?.twitter_followers || 0,
      redditSubscribers: d.community_data?.reddit_subscribers || 0,
      genesisDate:       d.genesis_date || null
    };
  } catch (err) {
    console.warn(`[Comparison] Failed to fetch ${coinId}:`, err.message);
    return null;
  }
};

/**
 * Rule-based fallback comparison when Gemini is unavailable.
 */
const buildFallbackComparison = (a, b) => {
  const fmt  = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toFixed(2)}`;
  const pct  = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

  // Compute simple risk labels based on market cap
  const riskLabel = (cap) => cap > 100e9 ? 'Lower' : cap > 10e9 ? 'Moderate' : 'Higher';
  const volScore  = (coin) => Math.abs(coin.change7d) + Math.abs(coin.change30d);
  const commScore = (coin) => coin.twitterFollowers + coin.redditSubscribers;

  const aRisk = riskLabel(a.marketCap);
  const bRisk = riskLabel(b.marketCap);
  const aVol  = volScore(a);
  const bVol  = volScore(b);
  const aComm = commScore(a);
  const bComm = commScore(b);

  const prosA = [
    a.rank < b.rank ? `Higher market cap rank (#${a.rank} vs #${b.rank}) indicates broader adoption.` : null,
    a.change24h > b.change24h ? `Outperformed ${b.symbol} in the last 24 hours (+${a.change24h.toFixed(2)}% vs ${b.change24h.toFixed(2)}%).` : null,
    aComm > bComm ? `Larger social community (${(aComm/1e6).toFixed(1)}M followers) suggests strong user engagement.` : null,
    aRisk === 'Lower' ? `Large-cap asset with lower historical volatility compared to smaller coins.` : null
  ].filter(Boolean).slice(0, 3);
  if (prosA.length === 0) prosA.push(`${a.name} is a well-known digital asset with an active development community.`);

  const prosB = [
    b.rank < a.rank ? `Higher market cap rank (#${b.rank} vs #${a.rank}) indicates broader adoption.` : null,
    b.change24h > a.change24h ? `Outperformed ${a.symbol} in the last 24 hours (+${b.change24h.toFixed(2)}% vs ${a.change24h.toFixed(2)}%).` : null,
    bComm > aComm ? `Larger social community (${(bComm/1e6).toFixed(1)}M followers) suggests strong user engagement.` : null,
    bRisk === 'Lower' ? `Large-cap asset with lower historical volatility compared to smaller coins.` : null
  ].filter(Boolean).slice(0, 3);
  if (prosB.length === 0) prosB.push(`${b.name} is a well-known digital asset with an active development community.`);

  const consA = [
    a.rank > b.rank ? `Lower market cap rank (#${a.rank}) compared to ${b.symbol} (#${b.rank}).` : null,
    aVol > bVol ? `Higher historical price volatility (${pct(a.change30d)} 30d swing) vs ${b.symbol}.` : null
  ].filter(Boolean).slice(0, 2);
  if (consA.length === 0) consA.push(`All cryptocurrencies carry inherent price volatility risk.`);

  const consB = [
    b.rank > a.rank ? `Lower market cap rank (#${b.rank}) compared to ${a.symbol} (#${a.rank}).` : null,
    bVol > aVol ? `Higher historical price volatility (${pct(b.change30d)} 30d swing) vs ${a.symbol}.` : null
  ].filter(Boolean).slice(0, 2);
  if (consB.length === 0) consB.push(`All cryptocurrencies carry inherent price volatility risk.`);

  const beginnerComparison = `Comparing ${a.name} and ${b.name}: Think of ${a.name} as ` +
    (a.rank <= 2 ? 'digital gold — the most established and widely-held crypto asset' : `a crypto project ranked #${a.rank} by total market size`) +
    `, while ${b.name} is ` +
    (b.rank <= 2 ? 'digital gold — the most established and widely-held crypto asset' : `ranked #${b.rank} and known for its unique blockchain capabilities`) +
    `. ${a.name} currently trades at $${a.price.toLocaleString()} and ${b.name} at $${b.price.toLocaleString()}. ` +
    `Both assets can go up or down significantly in value — crypto investing always carries risk. `+
    `Disclaimer: This is educational information, not financial advice.`;

  const riskExplanation = `${a.name} carries ${aRisk.toLowerCase()} risk relative to the crypto market ` +
    `(market cap: ${fmt(a.marketCap)}), while ${b.name} carries ${bRisk.toLowerCase()} risk ` +
    `(market cap: ${fmt(b.marketCap)}). ` +
    `Larger market cap generally means less volatility, but all crypto assets can experience sharp price moves. ` +
    `Both coins have shown significant price swings over 30 days (${a.symbol}: ${pct(a.change30d)}, ${b.symbol}: ${pct(b.change30d)}). ` +
    `Disclaimer: This is educational information, not financial advice.`;

  const summaryTable = [
    { metric: 'Price (USD)',       coinA: `$${a.price.toLocaleString()}`,        coinB: `$${b.price.toLocaleString()}` },
    { metric: 'Market Cap',        coinA: fmt(a.marketCap),                       coinB: fmt(b.marketCap) },
    { metric: '24h Volume',        coinA: fmt(a.volume24h),                       coinB: fmt(b.volume24h) },
    { metric: '24h Change',        coinA: pct(a.change24h),                       coinB: pct(b.change24h) },
    { metric: '7d Change',         coinA: pct(a.change7d),                        coinB: pct(b.change7d) },
    { metric: '30d Change',        coinA: pct(a.change30d),                       coinB: pct(b.change30d) },
    { metric: 'Market Cap Rank',   coinA: `#${a.rank}`,                           coinB: `#${b.rank}` },
    { metric: 'Risk Level',        coinA: aRisk,                                  coinB: bRisk },
    { metric: 'Volatility (30d)',  coinA: aVol > bVol ? 'Higher' : 'Lower',       coinB: bVol > aVol ? 'Higher' : 'Lower' },
    { metric: 'Community Size',    coinA: aComm > bComm ? 'Larger' : 'Smaller',   coinB: bComm > aComm ? 'Larger' : 'Smaller' }
  ];

  return { prosA, consA, prosB, consB, beginnerComparison, riskExplanation, summaryTable };
};

/**
 * @route   POST /api/ai/compare-coins
 * @desc    AI-powered educational comparison of two crypto assets
 * @access  Private
 */
export const compareCoins = async (req, res, next) => {
  try {
    const { coinIdA, coinIdB } = req.body;

    if (!coinIdA || !coinIdB) {
      return errorResponse(res, 400, 'Please provide both coinIdA and coinIdB in the request body.');
    }
    if (coinIdA.toLowerCase() === coinIdB.toLowerCase()) {
      return errorResponse(res, 400, 'Please select two different coins to compare.');
    }

    // 1. Fetch both coins in parallel
    const [coinA, coinB] = await Promise.all([
      fetchCoinForComparison(coinIdA),
      fetchCoinForComparison(coinIdB)
    ]);

    if (!coinA) return errorResponse(res, 404, `Could not find coin data for "${coinIdA}". Please check the CoinGecko coin ID.`);
    if (!coinB) return errorResponse(res, 404, `Could not find coin data for "${coinIdB}". Please check the CoinGecko coin ID.`);

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey.includes('placeholder') || apiKey.trim() === '';

    let prosA, consA, prosB, consB, beginnerComparison, riskExplanation, summaryTable;

    if (isMock) {
      console.log('[Coin Comparison] No API key — using rule-based fallback.');
      ({ prosA, consA, prosB, consB, beginnerComparison, riskExplanation, summaryTable } = buildFallbackComparison(coinA, coinB));
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const fmt = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${n.toFixed(2)}`;

        const prompt = `You are CryptoVision AI Co-Pilot — an educational crypto comparison assistant.
RULES: Never give explicit buy, sell, or trade recommendations. All analysis must be educational and risk-aware.
End every text field with: "Disclaimer: This is educational information, not financial advice."

Compare these two cryptocurrencies:

Coin A — ${coinA.name} (${coinA.symbol})
- Price: $${coinA.price.toLocaleString()}
- Market Cap: ${fmt(coinA.marketCap)} (Rank #${coinA.rank})
- 24h Volume: ${fmt(coinA.volume24h)}
- 24h/7d/30d Change: ${coinA.change24h.toFixed(2)}% / ${coinA.change7d.toFixed(2)}% / ${coinA.change30d.toFixed(2)}%
- Circulating Supply: ${coinA.circulatingSupply.toLocaleString()}
- Twitter Followers: ${coinA.twitterFollowers.toLocaleString()}
- Description: ${coinA.description}

Coin B — ${coinB.name} (${coinB.symbol})
- Price: $${coinB.price.toLocaleString()}
- Market Cap: ${fmt(coinB.marketCap)} (Rank #${coinB.rank})
- 24h Volume: ${fmt(coinB.volume24h)}
- 24h/7d/30d Change: ${coinB.change24h.toFixed(2)}% / ${coinB.change7d.toFixed(2)}% / ${coinB.change30d.toFixed(2)}%
- Circulating Supply: ${coinB.circulatingSupply.toLocaleString()}
- Twitter Followers: ${coinB.twitterFollowers.toLocaleString()}
- Description: ${coinB.description}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "beginnerComparison": "<2-3 sentence simple analogy-rich explanation comparing both coins for a complete beginner. End with disclaimer.>",
  "riskExplanation": "<2-3 sentence educational risk comparison, mentioning volatility, market cap, and why crypto is risky in general. End with disclaimer.>",
  "prosA": ["<pro 1 for ${coinA.name}>", "<pro 2>", "<pro 3>"],
  "consA": ["<con 1 for ${coinA.name}>", "<con 2>"],
  "prosB": ["<pro 1 for ${coinB.name}>", "<pro 2>", "<pro 3>"],
  "consB": ["<con 1 for ${coinB.name}>", "<con 2>"],
  "useCaseA": "<one sentence use-case description for ${coinA.name}>",
  "useCaseB": "<one sentence use-case description for ${coinB.name}>",
  "communityStrengthA": "Strong|Moderate|Emerging",
  "communityStrengthB": "Strong|Moderate|Emerging",
  "volatilityA": "Low|Moderate|High",
  "volatilityB": "Low|Moderate|High",
  "riskLevelA": "Low|Moderate|High",
  "riskLevelB": "Low|Moderate|High"
}`;

        console.log('[Gemini API] Requesting coin comparison analysis...');
        const result = await model.generateContent(prompt);
        const rawText = result.response.text().trim();
        const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        const disclaimer = 'Disclaimer: This is educational information, not financial advice.';
        const ensureDisclaimer = (s) => (s || '').includes(disclaimer) ? s : `${s}\n\n${disclaimer}`;

        prosA             = Array.isArray(parsed.prosA) ? parsed.prosA : [];
        consA             = Array.isArray(parsed.consA) ? parsed.consA : [];
        prosB             = Array.isArray(parsed.prosB) ? parsed.prosB : [];
        consB             = Array.isArray(parsed.consB) ? parsed.consB : [];
        beginnerComparison = ensureDisclaimer(parsed.beginnerComparison || '');
        riskExplanation    = ensureDisclaimer(parsed.riskExplanation || '');

        const fmt2 = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${n.toFixed(2)}`;
        const pct  = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

        summaryTable = [
          { metric: 'Price (USD)',         coinA: `$${coinA.price.toLocaleString()}`,   coinB: `$${coinB.price.toLocaleString()}` },
          { metric: 'Market Cap',          coinA: fmt2(coinA.marketCap),                coinB: fmt2(coinB.marketCap) },
          { metric: '24h Volume',          coinA: fmt2(coinA.volume24h),                coinB: fmt2(coinB.volume24h) },
          { metric: '24h Change',          coinA: pct(coinA.change24h),                 coinB: pct(coinB.change24h) },
          { metric: '7d Change',           coinA: pct(coinA.change7d),                  coinB: pct(coinB.change7d) },
          { metric: '30d Change',          coinA: pct(coinA.change30d),                 coinB: pct(coinB.change30d) },
          { metric: 'Market Cap Rank',     coinA: `#${coinA.rank}`,                     coinB: `#${coinB.rank}` },
          { metric: 'Use Case',            coinA: parsed.useCaseA || '—',              coinB: parsed.useCaseB || '—' },
          { metric: 'Risk Level',          coinA: parsed.riskLevelA || '—',            coinB: parsed.riskLevelB || '—' },
          { metric: 'Volatility',          coinA: parsed.volatilityA || '—',           coinB: parsed.volatilityB || '—' },
          { metric: 'Community Strength',  coinA: parsed.communityStrengthA || '—',   coinB: parsed.communityStrengthB || '—' }
        ];
      } catch (geminiErr) {
        console.error('[Gemini Comparison Error] Falling back to rule-based:', geminiErr.message);
        ({ prosA, consA, prosB, consB, beginnerComparison, riskExplanation, summaryTable } = buildFallbackComparison(coinA, coinB));
      }
    }

    return successResponse(res, 200, 'Coin comparison generated successfully.', {
      coinA, coinB,
      comparison: { prosA, consA, prosB, consB, beginnerComparison, riskExplanation, summaryTable }
    });

  } catch (err) {
    next(err);
  }
};

