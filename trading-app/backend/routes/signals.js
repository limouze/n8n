const express = require('express');
const { PrismaClient } = require('@prisma/client');

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

// Get latest signal for a stock
router.get('/:symbol', verifyToken, async (req, res) => {
  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol: req.params.symbol.toUpperCase() }
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const signal = await prisma.signal.findFirst({
      where: { stockId: stock.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!signal) {
      return res.status(404).json({ error: 'No signal available' });
    }

    res.json(signal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all signals (dashboard)
router.get('/', verifyToken, async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: {
        signals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const signals = stocks
      .filter(s => s.signals.length > 0)
      .map(stock => ({
        ...stock.signals[0],
        symbol: stock.symbol,
        name: stock.name
      }));

    // Sort by score descending (highest confidence signals first)
    signals.sort((a, b) => Math.abs(b.score - 50) - Math.abs(a.score - 50));

    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get signal history for a stock
router.get('/:symbol/history', verifyToken, async (req, res) => {
  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol: req.params.symbol.toUpperCase() }
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const signals = await prisma.signal.findMany({
      where: { stockId: stock.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
