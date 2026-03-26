const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { STOCKS_FALLBACK } = require('../services/scraper');

const router = express.Router();
const prisma = new PrismaClient();

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ alerts });
  } catch (err) {
    console.error('Get alerts error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { symbol, condition } = req.body;

    if (!symbol || !condition) {
      return res.status(400).json({ error: 'Symbole et condition requis' });
    }

    const validConditions = ['ACHAT', 'VENTE', 'NEUTRE'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({ error: 'Condition invalide. Valeurs: ACHAT, VENTE, NEUTRE' });
    }

    const fallback = STOCKS_FALLBACK.find(s => s.symbol === symbol);
    let stock = await prisma.stock.findUnique({ where: { symbol } });

    if (!stock) {
      if (!fallback) return res.status(404).json({ error: 'Action introuvable' });
      stock = await prisma.stock.create({
        data: {
          symbol,
          name: fallback.name,
          lastPrice: fallback.lastPrice,
          change: fallback.change,
          changePercent: fallback.changePercent,
          volume: fallback.volume,
        },
      });
    }

    const existing = await prisma.alert.findFirst({
      where: { userId: req.user.userId, symbol, condition, triggered: false },
    });
    if (existing) {
      return res.status(409).json({ error: 'Une alerte identique existe déjà' });
    }

    const alert = await prisma.alert.create({
      data: {
        userId: req.user.userId,
        stockId: stock.id,
        symbol,
        condition,
      },
    });

    res.status(201).json({ alert });
  } catch (err) {
    console.error('Create alert error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de l\'alerte' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const alert = await prisma.alert.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alerte introuvable' });
    }

    await prisma.alert.delete({ where: { id } });
    res.json({ message: 'Alerte supprimée' });
  } catch (err) {
    console.error('Delete alert error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'alerte' });
  }
});

router.get('/triggered', async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { userId: req.user.userId, triggered: true },
      orderBy: { triggeredAt: 'desc' },
      take: 20,
    });
    res.json({ alerts });
  } catch (err) {
    console.error('Triggered alerts error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes déclenchées' });
  }
});

module.exports = router;
