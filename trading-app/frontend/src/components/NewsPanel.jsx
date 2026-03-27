import React from 'react';

export default function NewsPanel({ news, newsScore }) {
  const getSentimentColor = (impact) => {
    if (impact === 'Positif') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (impact === 'Négatif') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getSentimentIcon = (impact) => {
    if (impact === 'Positif') return '👍';
    if (impact === 'Négatif') return '👎';
    return '➡️';
  };

  if (!news || news.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📰 Actualités</h3>
        <p className="text-gray-400">Aucune actualité disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📰 Actualités</h3>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-blue-400">{newsScore}</div>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {news.map((article, idx) => (
          <a
            key={idx}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition border border-gray-600 hover:border-gray-500"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="font-semibold text-sm text-white line-clamp-2">
                {article.titre}
              </h4>
              <span className={`badge px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getSentimentColor(article.impact)}`}>
                {getSentimentIcon(article.impact)} {article.impact}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{article.source}</span>
              <span>{new Date(article.date).toLocaleDateString('fr-FR')}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
