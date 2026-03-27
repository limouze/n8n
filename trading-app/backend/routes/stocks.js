const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { computeIndicators } = require('../services/indicators');
const { scoreFundamental, getFundamentalDetails } = require('../services/fundamentals');
const { fetchNews, analyzeNewsArticles } = require('../services/newsService');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all stocks
router.get('/', verifyToken, async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: {
        signals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        fundamentals: true
      }
    });

    const enriched = stocks.map(stock => ({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      lastSignal: stock.signals[0] || null,
      fundamentals: stock.fundamentals
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single stock details
router.get('/:symbol', verifyToken, async (req, res) => {
  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol: req.params.symbol.toUpperCase() },
      include: {
        candles: {
          orderBy: { date: 'asc' },
          take: 120  // 6 months of daily data
        },
        signals: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        fundamentals: true
      }
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Calculate current indicators
    const indicators = computeIndicators(stock.candles);
    const fundamentalScore = scoreFundamental(stock.fundamentals);

    // Fetch latest news
    const news = await fetchNews(stock.name);
    const newsAnalysis = analyzeNewsArticles(news);

    // Get last 5 news articles for this stock
    const recentNews = await prisma.newsArticle.findMany({
      where: { symbol: stock.symbol },
      orderBy: { date: 'desc' },
      take: 5
    });

    const response = {
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      candles: stock.candles,
      indicators,
      fundamentals: stock.fundamentals ? {
        per: stock.fundamentals.per.toFixed(2),
        pbRatio: stock.fundamentals.pbRatio.toFixed(2),
        dividende: stock.fundamentals.dividende.toFixed(2),
        croissanceCA: stock.fundamentals.croissanceCA.toFixed(2),
        margeNette: stock.fundamentals.margeNette.toFixed(2)
      } : null,
      fundamentalScore,
      news: recentNews.length > 0 ? recentNews : newsAnalysis.articles.slice(0, 5),
      newsScore: newsAnalysis.sentimentScore,
      lastSignal: stock.signals[0] || null,
      signalHistory: stock.signals
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get price chart data
router.get('/:symbol/chart', verifyToken, async (req, res) => {
  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol: req.params.symbol.toUpperCase() },
      include: {
        candles: {
          orderBy: { date: 'asc' },
          take: 60  // Last 3 months
        }
      }
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const chartData = stock.candles.map(candle => ({
      date: candle.date.toISOString().split('T')[0],
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
