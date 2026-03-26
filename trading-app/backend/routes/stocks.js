const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { scrapeBourseCasablanca, scrapeStockDetail, STOCKS_FALLBACK } = require('../services/scraper');
const { getCache, setCache } = require('../services/cacheService');

const router = express.Router();
const prisma = new PrismaClient();

const CACHE_TTL_STOCKS = 15 * 60; // 15 minutes

router.get('/', async (req, res) => {
  try {
    const cacheKey = 'stocks:list';
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ stocks: cached, fromCache: true });
    }

    const stocks = await scrapeBourseCasablanca();

    for (const stock of stocks) {
      await prisma.stock.upsert({
        where: { symbol: stock.symbol },
        update: {
          lastPrice: stock.lastPrice,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          updatedAt: new Date(),
        },
        create: {
          symbol: stock.symbol,
          name: stock.name,
          lastPrice: stock.lastPrice,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
        },
      });
    }

    const latestAnalyses = await prisma.analysis.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      distinct: ['symbol'],
    });

    const analysisMap = {};
    for (const a of latestAnalyses) {
      analysisMap[a.symbol] = { signal: a.signal, score: a.score };
    }

    const enriched = stocks.map(s => ({
      ...s,
      signal: analysisMap[s.symbol]?.signal || null,
      score: analysisMap[s.symbol]?.score || null,
    }));

    await setCache(cacheKey, enriched, CACHE_TTL_STOCKS);
    res.json({ stocks: enriched, fromCache: false });
  } catch (err) {
    console.error('Stocks list error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des actions' });
  }
});

router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `stock:detail:${symbol}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const stock = await prisma.stock.findUnique({ where: { symbol } });
    const fallback = STOCKS_FALLBACK.find(s => s.symbol === symbol);

    if (!stock && !fallback) {
      return res.status(404).json({ error: 'Action introuvable' });
    }

    const history = await scrapeStockDetail(symbol);

    const result = {
      symbol,
      name: stock?.name || fallback?.name,
      lastPrice: stock?.lastPrice || fallback?.lastPrice,
      change: stock?.change || fallback?.change,
      changePercent: stock?.changePercent || fallback?.changePercent,
      volume: stock?.volume || fallback?.volume,
      history,
    };

    await setCache(cacheKey, result, CACHE_TTL_STOCKS);
    res.json({ ...result, fromCache: false });
  } catch (err) {
    console.error('Stock detail error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du détail' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { deleteCache } = require('../services/cacheService');
    await deleteCache('stocks:list');

    const stocks = await scrapeBourseCasablanca();

    for (const stock of stocks) {
      await prisma.stock.upsert({
        where: { symbol: stock.symbol },
        update: {
          lastPrice: stock.lastPrice,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          updatedAt: new Date(),
        },
        create: {
          symbol: stock.symbol,
          name: stock.name,
          lastPrice: stock.lastPrice,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
        },
      });
    }

    const latestAnalyses = await prisma.analysis.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      distinct: ['symbol'],
    });

    const analysisMap = {};
    for (const a of latestAnalyses) {
      analysisMap[a.symbol] = { signal: a.signal, score: a.score };
    }

    const enriched = stocks.map(s => ({
      ...s,
      signal: analysisMap[s.symbol]?.signal || null,
      score: analysisMap[s.symbol]?.score || null,
    }));

    await setCache('stocks:list', enriched, CACHE_TTL_STOCKS);
    res.json({ stocks: enriched, message: 'Données fraîchaîries avec succès' });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Erreur lors du rafraîchissement' });
  }
});

module.exports = router;
