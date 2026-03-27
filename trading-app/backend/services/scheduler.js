const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { scrapeStock } = require('./scraper');
const { computeIndicators } = require('./indicators');
const { scoreFundamental } = require('./fundamentals');
const { fetchNews, analyzeNewsArticles } = require('./newsService');
const { computeFinalSignal } = require('./signalEngine');

const prisma = new PrismaClient();

const updateStockSignals = async (stock) => {
  try {
    // Scrape latest data
    const scrapeResult = await scrapeStock(stock.symbol);
    const candles = scrapeResult.candles.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Save candles to database
    for (const candle of candles) {
      await prisma.candle.upsert({
        where: {
          stockId_date: {
            stockId: stock.id,
            date: new Date(candle.date)
          }
        },
        update: {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        },
        create: {
          stockId: stock.id,
          date: new Date(candle.date),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        }
      });
    }

    // Calculate indicators
    const indicators = computeIndicators(candles);

    // Get fundamental data
    const fundamental = await prisma.fundamental.findUnique({
      where: { stockId: stock.id }
    });
    const fundamentalScore = scoreFundamental(fundamental);

    // Fetch and analyze news
    const news = await fetchNews(stock.name);
    const newsAnalysis = analyzeNewsArticles(news);

    // Compute final signal
    const finalSignal = computeFinalSignal(indicators, fundamentalScore, newsAnalysis.sentimentScore);

    // Save signal to database
    const signal = await prisma.signal.create({
      data: {
        stockId: stock.id,
        score: finalSignal.score,
        signal: finalSignal.signal,
        confidence: finalSignal.confidence,
        technicalScore: finalSignal.technicalScore,
        fundamentalScore,
        newsScore: newsAnalysis.sentimentScore,
        rsiSignal: indicators.rsi.signal,
        macdSignal: indicators.macd.signal,
        mmSignal: indicators.mm20.signal === 'bullish' ? 'bullish' : 'bearish',
        stochSignal: indicators.stochastique.signal,
        vwapSignal: indicators.vwap.signal
      }
    });

    // Save news articles
    for (const article of newsAnalysis.articles) {
      await prisma.newsArticle.create({
        data: {
          symbol: stock.symbol,
          titre: article.titre,
          source: article.source,
          url: article.url,
          impact: article.impact,
          score: article.score,
          date: new Date(article.date)
        }
      });
    }

    console.log(`✓ Updated signal for ${stock.symbol}: ${finalSignal.signal} (${finalSignal.score})`);
    return { success: true, signal };
  } catch (error) {
    console.error(`✗ Failed to update ${stock.symbol}:`, error.message);
    return { success: false, error: error.message };
  }
};

const startScheduler = () => {
  console.log('Starting signal update scheduler...');

  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log(`\n📊 Running scheduled update at ${new Date().toISOString()}`);

    const stocks = await prisma.stock.findMany();

    for (const stock of stocks) {
      await updateStockSignals(stock);
    }

    console.log('✓ Update cycle completed\n');
  });

  // Also run immediately on startup
  (async () => {
    console.log(`\n📊 Running initial update at ${new Date().toISOString()}`);
    const stocks = await prisma.stock.findMany();

    for (const stock of stocks) {
      await updateStockSignals(stock);
    }

    console.log('✓ Initial update completed\n');
  })();
};

module.exports = {
  startScheduler,
  updateStockSignals
};
