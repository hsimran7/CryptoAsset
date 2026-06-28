import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import DailySummary from '../models/DailySummary.js';
import { successResponse } from '../utils/apiResponse.js';

/* ─── helpers ──────────────────────────────────────────── */

/** Returns today's date as a 'YYYY-MM-DD' UTC string */
const todayKey = () => new Date().toISOString().slice(0, 10);

/** Safely fetch from a URL with a timeout, returning null on error */
const safeFetch = async (url, params = {}, timeout = 6000) => {
  try {
    const res = await axios.get(url, {
      params,
      headers: { accept: 'application/json' },
      timeout
    });
    return res.data;
  } catch (err) {
    console.warn(`[News] safeFetch warning for ${url}:`, err.message);
    return null;
  }
};

/* ─── Data fetchers ─────────────────────────────────────── */

const fetchTrendingCoins = async () => {
  const data = await safeFetch('https://api.coingecko.com/api/v3/search/trending');
  if (!data?.coins) return [];
  return data.coins.slice(0, 7).map(c => ({
    id:     c.item.id,
    name:   c.item.name,
    symbol: c.item.symbol,
    rank:   c.item.market_cap_rank,
    thumb:  c.item.thumb,
    score:  c.item.score
  }));
};

const fetchTopMovers = async () => {
  const data = await safeFetch('https://api.coingecko.com/api/v3/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: 50,
    page: 1,
    price_change_percentage: '24h'
  });
  if (!Array.isArray(data)) return { gainers: [], losers: [] };

  const sorted = [...data].sort((a, b) =>
    (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  );

  const mapCoin = c => ({
    id:       c.id,
    name:     c.name,
    symbol:   c.symbol.toUpperCase(),
    price:    c.current_price,
    change24h: parseFloat((c.price_change_percentage_24h || 0).toFixed(2)),
    image:    c.image
  });

  return {
    gainers: sorted.slice(0, 5).map(mapCoin),
    losers:  sorted.slice(-5).reverse().map(mapCoin)
  };
};

const fetchCryptoNews = async () => {
  // Primary: CryptoCompare public news (no key required)
  const data = await safeFetch('https://min-api.cryptocompare.com/data/v2/news/', {
    lang: 'EN',
    sortOrder: 'latest'
  });

  if (data?.Data && Array.isArray(data.Data)) {
    return data.Data.slice(0, 8).map(a => ({
      title:       a.title,
      url:         a.url,
      source:      a.source_info?.name || a.source,
      publishedAt: new Date(a.published_on * 1000).toISOString(),
      body:        (a.body || '').slice(0, 300)
    }));
  }

  // Fallback: CoinGecko status updates (very basic, always available)
  console.warn('[News] CryptoCompare unavailable — using CoinGecko status updates as fallback.');
  return [];
};

/* ─── Fallback rule-based sentiment ─────────────────────── */

const POSITIVE_WORDS = ['surge', 'rally', 'gain', 'jump', 'high', 'bull', 'rise', 'soar', 'record', 'adopt', 'approval', 'launch', 'growth', 'strong', 'buy'];
const NEGATIVE_WORDS = ['crash', 'drop', 'fall', 'bear', 'decline', 'hack', 'ban', 'plunge', 'fear', 'sell', 'loss', 'fraud', 'warn', 'risk', 'low'];

const ruleSentiment = (text) => {
  const lower = text.toLowerCase();
  const pos = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  const neg = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
  if (pos > neg + 1) return { sentiment: 'Positive', score: Math.min(pos * 15, 90) };
  if (neg > pos + 1) return { sentiment: 'Negative', score: Math.min(neg * 15, 90) };
  return { sentiment: 'Neutral', score: 50 };
};

const buildFallbackSentiment = (articles) =>
  articles.map(a => {
    const { sentiment, score } = ruleSentiment(a.title + ' ' + a.body);
    return {
      title:       a.title,
      url:         a.url,
      sentiment,
      sentimentScore: score,
      explanation: `Rule-based analysis: "${a.title.slice(0, 60)}…" signals ${sentiment.toLowerCase()} sentiment based on keyword frequency.`
    };
  });

const deriveOverallSentiment = (sentimentList) => {
  const counts = { Positive: 0, Neutral: 0, Negative: 0 };
  sentimentList.forEach(s => { counts[s.sentiment] = (counts[s.sentiment] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
};

/* ─── Gemini AI narrative generation ───────────────────── */

const buildFallbackNarratives = (gainers, losers, trending, overallSentiment) => {
  const topGainer = gainers[0];
  const topLoser  = losers[0];
  const trendNames = trending.slice(0, 3).map(t => t.name).join(', ');

  const aiSummary = `Daily Market Briefing: The broader crypto market is showing ${overallSentiment.toLowerCase()} sentiment today. ` +
    (topGainer ? `${topGainer.name} (${topGainer.symbol}) leads today's gainers with a ${topGainer.change24h > 0 ? '+' : ''}${topGainer.change24h}% move. ` : '') +
    (topLoser  ? `${topLoser.name} (${topLoser.symbol}) is the notable decliner at ${topLoser.change24h}%. ` : '') +
    (trendNames ? `Trending searches include ${trendNames}. ` : '') +
    `Overall market structure remains in a dynamic consolidation phase. Monitor key support and resistance levels across major assets. ` +
    `Disclaimer: This is educational information, not financial advice.`;

  const beginnerSummary = `Today's crypto markets are feeling ${overallSentiment.toLowerCase()}! ` +
    (topGainer ? `The biggest winner today is ${topGainer.name} — it went up ${topGainer.change24h > 0 ? '+' : ''}${topGainer.change24h}%, which means its price rose significantly in 24 hours. ` : '') +
    (topLoser  ? `Meanwhile, ${topLoser.name} went down ${topLoser.change24h}% — its value dropped today. ` : '') +
    `Remember: crypto prices go up and down every day. This is totally normal. The important thing is to understand the trend, not to panic when prices move. ` +
    `Disclaimer: This is educational information, not financial advice.`;

  return { aiSummary, beginnerSummary };
};

const generateGeminiNarratives = async (apiKey, gainers, losers, trending, overallSentiment, newsSentiment, newsArticles) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const topNews = newsArticles.slice(0, 5).map(a => `- "${a.title}" (${a.source})`).join('\n');
    const gainerList = gainers.slice(0, 3).map(g => `${g.symbol} +${g.change24h}%`).join(', ');
    const loserList  = losers.slice(0, 3).map(l => `${l.symbol} ${l.change24h}%`).join(', ');
    const trendList  = trending.slice(0, 5).map(t => t.name).join(', ');

    const prompt = `You are CryptoVision AI Co-Pilot. Write two educational daily market summaries based on the following real data:

TOP GAINERS: ${gainerList}
TOP LOSERS: ${loserList}
TRENDING COINS: ${trendList}
OVERALL MARKET SENTIMENT: ${overallSentiment}
TOP NEWS HEADLINES:
${topNews || 'No news available today.'}

RULES:
- Do NOT give buy/sell/trade advice.
- Use educational, risk-awareness language only.
- End each summary with: "Disclaimer: This is educational information, not financial advice."

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "aiSummary": "<2-3 sentence professional market briefing for experienced crypto enthusiasts>",
  "beginnerSummary": "<2-3 sentence simple, analogy-rich explanation for complete beginners>"
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    const disclaimer = 'Disclaimer: This is educational information, not financial advice.';
    const aiSummary      = parsed.aiSummary      + (parsed.aiSummary.includes(disclaimer)      ? '' : `\n\n${disclaimer}`);
    const beginnerSummary = parsed.beginnerSummary + (parsed.beginnerSummary.includes(disclaimer) ? '' : `\n\n${disclaimer}`);

    return { aiSummary, beginnerSummary };
  } catch (err) {
    console.warn('[Gemini Narratives] Falling back to rule-based narratives:', err.message);
    return buildFallbackNarratives(gainers, losers, trending, overallSentiment);
  }
};

const generateGeminiSentiment = async (apiKey, articles) => {
  if (!articles.length) return [];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const articleList = articles.map((a, i) =>
      `${i + 1}. "${a.title}" — ${(a.body || '').slice(0, 150)}`
    ).join('\n');

    const prompt = `Analyze the sentiment of these crypto news headlines and snippets. 
For each article, classify the crypto market sentiment as "Positive", "Neutral", or "Negative" with a score from 0–100 (100 = most extreme).

ARTICLES:
${articleList}

Respond ONLY with valid JSON array (no markdown, no code fences):
[
  { "index": 1, "sentiment": "Positive|Neutral|Negative", "sentimentScore": <0-100>, "explanation": "<one sentence explanation>" },
  ...
]`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    const cleaned = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return articles.map((a, i) => {
      const match = parsed.find(p => p.index === i + 1) || {};
      return {
        title:          a.title,
        url:            a.url,
        sentiment:      match.sentiment      || 'Neutral',
        sentimentScore: match.sentimentScore || 50,
        explanation:    match.explanation    || 'No explanation provided.'
      };
    });
  } catch (err) {
    console.warn('[Gemini Sentiment] Falling back to rule-based sentiment:', err.message);
    return buildFallbackSentiment(articles);
  }
};

/* ═══════════════════════════════════════════════════════════
   CONTROLLER: GET /api/ai/daily-summary
   ═══════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/ai/daily-summary
 * @desc    Returns today's AI daily market summary (cached once per day)
 * @access  Private
 */
export const getDailySummary = async (req, res, next) => {
  try {
    const key = todayKey();

    // 1. Check for today's existing cache
    const existing = await DailySummary.findOne({ dateKey: key });
    if (existing) {
      console.log(`[Daily Summary] Returning cached summary for ${key}.`);
      return successResponse(res, 200, 'Daily summary loaded from cache.', { summary: existing, cached: true });
    }

    console.log(`[Daily Summary] Generating new summary for ${key}...`);

    // 2. Fetch all data in parallel
    const [trendingCoins, { gainers: topGainers, losers: topLosers }, newsArticles] = await Promise.all([
      fetchTrendingCoins(),
      fetchTopMovers(),
      fetchCryptoNews()
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey.includes('placeholder') || apiKey.trim() === '';

    // 3. Generate sentiment for news articles
    let newsSentiment;
    if (isMock) {
      newsSentiment = buildFallbackSentiment(newsArticles);
    } else {
      newsSentiment = await generateGeminiSentiment(apiKey, newsArticles);
    }

    const overallSentiment = deriveOverallSentiment(newsSentiment);

    // 4. Generate AI narratives
    let aiSummary, beginnerSummary;
    if (isMock) {
      ({ aiSummary, beginnerSummary } = buildFallbackNarratives(topGainers, topLosers, trendingCoins, overallSentiment));
    } else {
      ({ aiSummary, beginnerSummary } = await generateGeminiNarratives(
        apiKey, topGainers, topLosers, trendingCoins, overallSentiment, newsSentiment, newsArticles
      ));
    }

    // 5. Persist in DB
    const summary = await DailySummary.create({
      dateKey: key,
      trendingCoins,
      topGainers,
      topLosers,
      newsArticles,
      newsSentiment,
      overallSentiment,
      aiSummary,
      beginnerSummary
    });

    return successResponse(res, 201, 'Daily summary generated successfully.', { summary, cached: false });

  } catch (err) {
    next(err);
  }
};

/* ═══════════════════════════════════════════════════════════
   CONTROLLER: GET /api/news/sentiment
   ═══════════════════════════════════════════════════════════ */

/**
 * @route   GET /api/news/sentiment
 * @desc    Returns today's news sentiment results (standalone endpoint)
 * @access  Private
 */
export const getNewsSentiment = async (req, res, next) => {
  try {
    const key = todayKey();
    const existing = await DailySummary.findOne({ dateKey: key });

    if (existing) {
      return successResponse(res, 200, 'News sentiment loaded.', {
        sentiment:        existing.newsSentiment,
        overallSentiment: existing.overallSentiment,
        generatedAt:      existing.generatedAt
      });
    }

    // No summary for today yet — fetch and analyze news now
    const newsArticles = await fetchCryptoNews();
    const apiKey = process.env.GEMINI_API_KEY;
    const isMock = !apiKey || apiKey.includes('placeholder') || apiKey.trim() === '';

    const newsSentiment = isMock
      ? buildFallbackSentiment(newsArticles)
      : await generateGeminiSentiment(apiKey, newsArticles);

    const overallSentiment = deriveOverallSentiment(newsSentiment);

    return successResponse(res, 200, 'News sentiment generated.', {
      sentiment:        newsSentiment,
      overallSentiment,
      generatedAt:      new Date()
    });
  } catch (err) {
    next(err);
  }
};
