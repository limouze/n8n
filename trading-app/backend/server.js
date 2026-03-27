const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { startScheduler } = require('./services/scheduler');

const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const signalRoutes = require('./routes/signals');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/signals', signalRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trading Signals API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);

  // Start background scheduler
  startScheduler();
});

module.exports = app;
