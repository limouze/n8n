import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stocksAPI } from '../api';
import SignalBadge from '../components/SignalBadge';

export default function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSignal, setFilterSignal] = useState('all');

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await stocksAPI.getAll();
      setStocks(response.data);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    if (filterSignal === 'all') return true;
    return stock.lastSignal?.signal === filterSignal;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Actions Cotées</h1>
        <p className="text-gray-400">Bourse de Casablanca - {stocks.length} actions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {['all', 'ACHAT', 'NEUTRE', 'VENTE'].map(signal => (
          <button
            key={signal}
            onClick={() => setFilterSignal(signal)}
            className={`px-4 py-2 rounded-lg transition ${
              filterSignal === signal
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {signal === 'all' ? 'Tous' : signal}
          </button>
        ))}
      </div>

      {/* Stocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : filteredStocks.length === 0 ? (
          <p className="text-gray-400">Aucune action trouvée</p>
        ) : (
          filteredStocks.map(stock => (
            <Link
              key={stock.id}
              to={`/stock/${stock.symbol}`}
              className="card hover:border-blue-500 hover:bg-gray-700/50 transition cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{stock.symbol}</h3>
                  <p className="text-sm text-gray-400">{stock.name}</p>
                </div>
                {stock.sector && (
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {stock.sector}
                  </span>
                )}
              </div>

              {stock.lastSignal ? (
                <>
                  <div className="mb-4">
                    <SignalBadge
                      signal={stock.lastSignal.signal}
                      confidence={stock.lastSignal.confidence}
                      score={stock.lastSignal.score}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-gray-700/30 rounded text-center">
                      <p className="text-gray-400">Technique</p>
                      <p className="font-bold text-blue-400">{stock.lastSignal.technicalScore}%</p>
                    </div>
                    <div className="p-2 bg-gray-700/30 rounded text-center">
                      <p className="text-gray-400">Fondamental</p>
                      <p className="font-bold text-purple-400">{stock.lastSignal.fundamentalScore}%</p>
                    </div>
                    <div className="p-2 bg-gray-700/30 rounded text-center">
                      <p className="text-gray-400">Actualités</p>
                      <p className="font-bold text-orange-400">{stock.lastSignal.newsScore}%</p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-400">
                    Mis à jour: {new Date(stock.lastSignal.createdAt).toLocaleString('fr-FR')}
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-sm">Aucun signal disponible</div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
