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

// Get user's alerts
router.get('/', verifyToken, async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create alert
router.post('/', verifyToken, async (req, res) => {
  try {
    const { symbol, condition } = req.body;

    if (!symbol || !condition) {
      return res.status(400).json({ error: 'Symbol and condition required' });
    }

    // Verify stock exists
    const stock = await prisma.stock.findUnique({
      where: { symbol: symbol.toUpperCase() }
    });

    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const alert = await prisma.alert.create({
      data: {
        userId: req.userId,
        symbol: symbol.toUpperCase(),
        condition
      }
    });

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update alert
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { condition, active } = req.body;

    const alert = await prisma.alert.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!alert || alert.userId !== req.userId) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updated = await prisma.alert.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(condition && { condition }),
        ...(active !== undefined && { active })
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const alert = await prisma.alert.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!alert || alert.userId !== req.userId) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await prisma.alert.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
