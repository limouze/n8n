import React, { useState, useEffect } from 'react';
import { signalsAPI, stocksAPI } from '../api';
import SignalTable from '../components/SignalTable';
import ScoreGauge from '../components/ScoreGauge';

export default function Dashboard() {
  const [signals, setSignals] = useState([]);
  const [stats, setStats] = useState({
    bullish: 0,
    bearish: 0,
    neutral: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      const response = await signalsAPI.getAll();
      setSignals(response.data);

      // Calculate stats
      const bullCount = response.data.filter(s => s.signal === 'ACHAT').length;
      const bearCount = response.data.filter(s => s.signal === 'VENTE').length;
      const neutCount = response.data.filter(s => s.signal === 'NEUTRE').length;
      const avgScore = Math.round(
        response.data.reduce((sum, s) => sum + s.score, 0) / Math.max(response.data.length, 1)
      );

      setStats({
        bullish: bullCount,
        bearish: bearCount,
        neutral: neutCount,
        avgScore
      });
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Tableau de Bord</h1>
        <p className="text-gray-400">Vue d'ensemble des signaux de trading</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-2xl font-bold text-green-400">{stats.bullish}</div>
          <p className="text-gray-400 text-sm">Signaux ACHAT</p>
        </div>

        <div className="card text-center">
          <div className="text-3xl mb-2">📉</div>
          <div className="text-2xl font-bold text-red-400">{stats.bearish}</div>
          <p className="text-gray-400 text-sm">Signaux VENTE</p>
        </div>

        <div className="card text-center">
          <div className="text-3xl mb-2">➡️</div>
          <div className="text-2xl font-bold text-gray-400">{stats.neutral}</div>
          <p className="text-gray-400 text-sm">Signaux NEUTRE</p>
        </div>

        <div className="card text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-blue-400">{stats.avgScore}</div>
          <p className="text-gray-400 text-sm">Score Moyen</p>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex flex-col items-center">
            <p className="text-gray-400 text-sm mb-4">Score Moyen Global</p>
            <ScoreGauge score={stats.avgScore} label="" size="medium" />
          </div>
        </div>
        <div className="card col-span-3">
          <h3 className="text-lg font-semibold mb-4">📊 Distribution des Signaux</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">ACHAT</span>
                <span className="text-sm font-semibold text-green-400">{stats.bullish}</span>
              </div>
              <div className="w-full bg-gray-700 rounded h-2">
                <div
                  className="bg-green-500 h-2 rounded"
                  style={{ width: `${Math.max(10, (stats.bullish / Math.max(signals.length, 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">NEUTRE</span>
                <span className="text-sm font-semibold text-gray-400">{stats.neutral}</span>
              </div>
              <div className="w-full bg-gray-700 rounded h-2">
                <div
                  className="bg-gray-500 h-2 rounded"
                  style={{ width: `${Math.max(10, (stats.neutral / Math.max(signals.length, 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-300">VENTE</span>
                <span className="text-sm font-semibold text-red-400">{stats.bearish}</span>
              </div>
              <div className="w-full bg-gray-700 rounded h-2">
                <div
                  className="bg-red-500 h-2 rounded"
                  style={{ width: `${Math.max(10, (stats.bearish / Math.max(signals.length, 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signals Table */}
      <SignalTable signals={signals} loading={loading} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-3">💡 Comment ça fonctionne</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>✓ 6 indicateurs techniques (RSI, MACD, MM, Stoch, VWAP)</li>
            <li>✓ Analyse fondamentale (PER, P/B, Dividendes)</li>
            <li>✓ Sentiment des actualités en temps réel</li>
            <li>✓ Mise à jour toutes les 15 minutes</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">🎯 Pondération</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>🔵 Technique: 50%</li>
            <li>🟣 Fondamental: 30%</li>
            <li>🟠 Actualités: 20%</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">⚠️ Disclaimer</h3>
          <p className="text-sm text-gray-400">
            Ces signaux sont à titre informatif uniquement. Ne constituent pas une recommandation d'investissement.
          </p>
        </div>
      </div>
    </div>
  );
}
