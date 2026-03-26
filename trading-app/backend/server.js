require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { cleanExpiredCache } = require('./services/cacheService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/alerts', require('./routes/alerts'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

setInterval(cleanExpiredCache, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API Bourse de Casablanca prête\n`);
});
