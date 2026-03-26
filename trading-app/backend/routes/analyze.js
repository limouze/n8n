const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { analyzeStock } = require('../services/claudeService');
const { getCache, setCache } = require('../services/cacheService');
const { STOCKS_FALLBACK } = require('../services/scraper');

const router = express.Router();
const prisma = new PrismaClient();

const CACHE_TTL_ANALYSIS = 30 * 60; // 30 minutes

router.post('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `analysis:${symbol}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const stock = await prisma.stock.findUnique({ where: { symbol } });
    const fallback = STOCKS_FALLBACK.find(s => s.symbol === symbol);

    if (!stock && !fallback) {
      return res.status(404).json({ error: 'Action introuvable' });
    }

    const currentPrice = stock?.lastPrice || fallback?.lastPrice;
    const volume = stock?.volume || fallback?.volume;
    const name = stock?.name || fallback?.name;

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-your-key-here') {
      const mockAnalysis = generateMockAnalysis(symbol, name, currentPrice, volume);
      await setCache(cacheKey, mockAnalysis, CACHE_TTL_ANALYSIS);
      await saveAnalysis(prisma, symbol, stock, mockAnalysis);
      return res.json({ ...mockAnalysis, fromCache: false, mock: true });
    }

    const analysis = await analyzeStock(symbol, name, currentPrice, volume);

    await setCache(cacheKey, analysis, CACHE_TTL_ANALYSIS);
    await saveAnalysis(prisma, symbol, stock, analysis);

    res.json({ ...analysis, fromCache: false });
  } catch (err) {
    console.error('Analysis error:', err);

    const { symbol } = req.params;
    const fallback = STOCKS_FALLBACK.find(s => s.symbol === symbol);
    if (fallback) {
      const mockAnalysis = generateMockAnalysis(symbol, fallback.name, fallback.lastPrice, fallback.volume);
      return res.json({ ...mockAnalysis, fromCache: false, mock: true, error: 'Analyse IA indisponible, données simulées utilisées' });
    }

    res.status(500).json({ error: 'Erreur lors de l\'analyse: ' + err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ analyses });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

async function saveAnalysis(prisma, symbol, stock, analysis) {
  try {
    let stockRecord = stock;
    if (!stockRecord) {
      const fallback = STOCKS_FALLBACK.find(s => s.symbol === symbol);
      stockRecord = await prisma.stock.upsert({
        where: { symbol },
        update: {},
        create: {
          symbol,
          name: fallback?.name || symbol,
          lastPrice: fallback?.lastPrice || 0,
          change: fallback?.change || 0,
          changePercent: fallback?.changePercent || 0,
          volume: fallback?.volume || 0,
        },
      });
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.analysis.create({
      data: {
        stockId: stockRecord.id,
        symbol,
        signal: analysis.signal,
        score: analysis.score,
        data: JSON.stringify(analysis),
        expiresAt,
      },
    });

    const alerts = await prisma.alert.findMany({
      where: { symbol, triggered: false, condition: analysis.signal },
    });

    for (const alert of alerts) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { triggered: true, triggeredAt: new Date() },
      });
    }
  } catch (err) {
    console.error('Save analysis error:', err.message);
  }
}

function generateMockAnalysis(symbol, name, currentPrice, volume) {
  const signalWeights = [0.4, 0.3, 0.3];
  const rand = Math.random();
  let signal = 'NEUTRE';
  if (rand < signalWeights[0]) signal = 'ACHAT';
  else if (rand < signalWeights[0] + signalWeights[1]) signal = 'VENTE';

  const score = signal === 'ACHAT' ? Math.floor(60 + Math.random() * 35)
    : signal === 'VENTE' ? Math.floor(15 + Math.random() * 30)
    : Math.floor(40 + Math.random() * 25);

  const rsi = (40 + Math.random() * 40).toFixed(1);
  const macdValue = ((Math.random() - 0.5) * 10).toFixed(2);
  const mm20 = (currentPrice * (0.97 + Math.random() * 0.06)).toFixed(2);
  const mm50 = (currentPrice * (0.94 + Math.random() * 0.12)).toFixed(2);

  const sentiments = ['Positif', 'Négatif', 'Neutre'];
  const sentiment = sentiments[Math.floor(Math.random() * 3)];

  const today = new Date();
  const fmtDate = (d) => d.toISOString().split('T')[0];

  return {
    score,
    signal,
    analyse_technique: {
      resume: `L'analyse technique de ${name} (${symbol}) indique une tendance ${signal === 'ACHAT' ? 'haussière' : signal === 'VENTE' ? 'baissière' : 'neutre'} avec un cours à ${currentPrice} MAD.`,
      indicateurs: [
        { label: 'RSI (14)', value: `${rsi}`, signal: rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral' },
        { label: 'MACD', value: `${macdValue}`, signal: parseFloat(macdValue) > 0 ? 'bullish' : 'bearish' },
        { label: 'MM 20j', value: `${mm20} MAD`, signal: currentPrice > parseFloat(mm20) ? 'bullish' : 'bearish' },
        { label: 'MM 50j', value: `${mm50} MAD`, signal: currentPrice > parseFloat(mm50) ? 'bullish' : 'bearish' },
        { label: 'Bollinger', value: `Bande med. ${(currentPrice * 0.995).toFixed(2)} MAD`, signal: 'neutral' },
        { label: 'Volume', value: `${volume.toLocaleString()} titres`, signal: volume > 50000 ? 'bullish' : 'neutral' },
      ],
    },
    analyse_fondamentale: {
      resume: `Les fondamentaux de ${name} restent ${signal === 'ACHAT' ? 'solides avec une valorisation attractive' : signal === 'VENTE' ? 'sous pression' : 'stables'}.`,
      indicateurs: [
        { label: 'PER', value: `${(12 + Math.random() * 18).toFixed(1)}x`, signal: 'neutral' },
        { label: 'P/B Ratio', value: `${(0.8 + Math.random() * 2.5).toFixed(2)}x`, signal: 'neutral' },
        { label: 'Dividende', value: `${(2 + Math.random() * 5).toFixed(1)}%`, signal: 'bullish' },
        { label: 'Croissance CA', value: `+${(2 + Math.random() * 12).toFixed(1)}%`, signal: 'bullish' },
        { label: 'Marge nette', value: `${(8 + Math.random() * 20).toFixed(1)}%`, signal: 'neutral' },
      ],
    },
    analyse_news: {
      sentiment,
      score_sentiment: Math.floor(40 + Math.random() * 50),
      actualites: [
        { titre: `${name} annonce ses résultats semestriels avec une hausse du bénéfice net`, impact: 'Positif', date: fmtDate(new Date(today - 2 * 86400000)) },
        { titre: `La Bourse de Casablanca en légère hausse portée par les valeurs bancaires`, impact: 'Neutre', date: fmtDate(new Date(today - 5 * 86400000)) },
        { titre: `${name} : les analystes maintiennent leur recommandation avec un objectif révisé`, impact: 'Neutre', date: fmtDate(new Date(today - 9 * 86400000)) },
      ],
    },
    risques: [
      'Volatilité des marchés émergents et exposition aux fluctuations de change',
      'Pression inflationniste sur les coûts opérationnels',
      'Concurrence accrue sur le marché marocain',
    ],
    opportunites: [
      'Croissance du marché intérieur marocain et expansion en Afrique subsaharienne',
      'Programme d\'investissement public 2024-2030 favorable au secteur',
      'Digitalisation accélérée ouvrant de nouveaux relais de croissance',
    ],
    objectif_prix: `${(currentPrice * (signal === 'ACHAT' ? 1.10 : signal === 'VENTE' ? 0.90 : 1.03)).toFixed(2)} MAD`,
    horizon: signal === 'ACHAT' ? 'Moyen terme' : signal === 'VENTE' ? 'Court terme' : 'Long terme',
  };
}

module.exports = router;
