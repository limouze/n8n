import React from 'react';
import { Link } from 'react-router-dom';
import SignalBadge from './SignalBadge';

export default function SignalTable({ signals, loading }) {
  if (loading) {
    return (
      <div className="card flex items-center justify-center h-64">
        <p className="text-gray-400">Chargement des signaux...</p>
      </div>
    );
  }

  if (!signals || signals.length === 0) {
    return (
      <div className="card flex items-center justify-center h-64">
        <p className="text-gray-400">Aucun signal disponible</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-6">📊 Tous les Signaux</h2>
      <table className="w-full text-sm">
        <thead className="border-b border-gray-600">
          <tr className="text-gray-400 text-left">
            <th className="pb-3">Symbole</th>
            <th className="pb-3">Signal</th>
            <th className="pb-3">Technique</th>
            <th className="pb-3">Fondamental</th>
            <th className="pb-3">Actualités</th>
            <th className="pb-3">Crédibilité</th>
            <th className="pb-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {signals.map((signal) => (
            <tr key={signal.id} className="hover:bg-gray-700/30 transition">
              <td className="py-4 font-semibold">{signal.symbol}</td>
              <td className="py-4">
                <SignalBadge
                  signal={signal.signal}
                  confidence={signal.confidence}
                  score={signal.score}
                />
              </td>
              <td className="py-4">
                <div className="text-blue-400 font-mono">{signal.technicalScore}%</div>
              </td>
              <td className="py-4">
                <div className="text-purple-400 font-mono">{signal.fundamentalScore}%</div>
              </td>
              <td className="py-4">
                <div className="text-orange-400 font-mono">{signal.newsScore}%</div>
              </td>
              <td className="py-4">
                <div className="text-gray-400 text-xs">
                  {signal.confidence === 'Forte' ? '⭐⭐⭐' : signal.confidence === 'Moyenne' ? '⭐⭐' : '⭐'}
                </div>
              </td>
              <td className="py-4">
                <Link
                  to={`/stock/${signal.symbol}`}
                  className="text-blue-400 hover:text-blue-300 transition text-sm"
                >
                  Détails →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 p-4 bg-gray-700/20 rounded text-sm text-gray-400">
        <p className="font-semibold mb-2">📊 Pondération du Score:</p>
        <div className="grid grid-cols-3 gap-4">
          <div>🔵 Technique: 50%</div>
          <div>🟣 Fondamental: 30%</div>
          <div>🟠 Actualités: 20%</div>
        </div>
      </div>
    </div>
  );
}
