import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stocksAPI } from '../api';
import SignalBadge from '../components/SignalBadge';
import IndicatorRow from '../components/IndicatorRow';
import PriceChart from '../components/PriceChart';
import ScoreGauge from '../components/ScoreGauge';
import NewsPanel from '../components/NewsPanel';

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
    const interval = setInterval(fetchStock, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchStock = async () => {
    try {
      const response = await stocksAPI.getOne(symbol);
      setStock(response.data);
    } catch (error) {
      console.error('Failed to fetch stock:', error);
      navigate('/stocks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-400">Action non trouvée</p>
      </div>
    );
  }

  const lastSignal = stock.lastSignal;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/stocks')}
          className="text-blue-400 hover:text-blue-300 mb-4"
        >
          ← Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">{stock.symbol}</h1>
            <p className="text-gray-400">{stock.name}</p>
          </div>
          {lastSignal && (
            <SignalBadge
              signal={lastSignal.signal}
              confidence={lastSignal.confidence}
              score={lastSignal.score}
            />
          )}
        </div>
      </div>

      {/* Price Chart */}
      <div className="mb-8">
        <PriceChart data={stock.candles} />
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ScoreGauge score={stock.indicators?.technicalScore || 50} label="Score Technique" />
        <ScoreGauge score={stock.fundamentalScore || 50} label="Score Fondamental" />
        <ScoreGauge score={stock.newsScore || 50} label="Score Actualités" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Indicators */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">🎯 Indicateurs Techniques</h3>
            <div className="space-y-2">
              {stock.indicators && (
                <>
                  <IndicatorRow
                    label="RSI (14)"
                    value={stock.indicators.rsi.value}
                    signal={stock.indicators.rsi.signal}
                  />
                  <IndicatorRow
                    label="MACD"
                    value={stock.indicators.macd.value}
                    signal={stock.indicators.macd.signal}
                  />
                  <IndicatorRow
                    label="Prix vs MM20"
                    value={stock.indicators.mm20.value}
                    signal={stock.indicators.mm20.signal}
                  />
                  <IndicatorRow
                    label="Prix vs MM50"
                    value={stock.indicators.mm50.value}
                    signal={stock.indicators.mm50.signal}
                  />
                  <IndicatorRow
                    label="Stochastique"
                    value={stock.indicators.stochastique.value}
                    signal={stock.indicators.stochastique.signal}
                  />
                  <IndicatorRow
                    label="VWAP"
                    value={stock.indicators.vwap.value}
                    signal={stock.indicators.vwap.signal}
                  />
                </>
              )}
            </div>
          </div>

          {/* Fundamentals */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">💼 Données Fondamentales</h3>
            {stock.fundamentals ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-700/30 rounded">
                  <p className="text-xs text-gray-400">P/E Ratio</p>
                  <p className="text-lg font-mono font-semibold">{stock.fundamentals.per}</p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded">
                  <p className="text-xs text-gray-400">P/B Ratio</p>
                  <p className="text-lg font-mono font-semibold">{stock.fundamentals.pbRatio}</p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded">
                  <p className="text-xs text-gray-400">Dividende (%)</p>
                  <p className="text-lg font-mono font-semibold">{stock.fundamentals.dividende}</p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded">
                  <p className="text-xs text-gray-400">Croissance CA (%)</p>
                  <p className="text-lg font-mono font-semibold">{stock.fundamentals.croissanceCA}</p>
                </div>
                <div className="p-3 bg-gray-700/30 rounded col-span-2">
                  <p className="text-xs text-gray-400">Marge Nette (%)</p>
                  <p className="text-lg font-mono font-semibold">{stock.fundamentals.margeNette}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Données fondamentales non disponibles</p>
            )}
          </div>
        </div>

        {/* News Panel */}
        <div>
          <NewsPanel news={stock.news} newsScore={stock.newsScore} />
        </div>
      </div>

      {/* Signal Reason */}
      {lastSignal && (
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold mb-4">📌 Analyse du Signal</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-700/30 rounded">
              <p className="text-xs text-gray-400 mb-2">Signal</p>
              <p className="text-lg font-bold">{lastSignal.signal}</p>
            </div>
            <div className="p-4 bg-gray-700/30 rounded">
              <p className="text-xs text-gray-400 mb-2">Score Global</p>
              <p className="text-lg font-bold">{lastSignal.score}/100</p>
            </div>
            <div className="p-4 bg-gray-700/30 rounded">
              <p className="text-xs text-gray-400 mb-2">Confiance</p>
              <p className="text-lg font-bold">{lastSignal.confidence}</p>
            </div>
            <div className="p-4 bg-gray-700/30 rounded">
              <p className="text-xs text-gray-400 mb-2">Mise à jour</p>
              <p className="text-lg font-bold">{new Date(lastSignal.createdAt).toLocaleTimeString('fr-FR')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
