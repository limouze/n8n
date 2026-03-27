import React from 'react';

export default function SignalBadge({ signal, confidence, score }) {
  const getSignalColor = () => {
    if (signal === 'ACHAT') return 'bg-green-600 text-white';
    if (signal === 'VENTE') return 'bg-red-600 text-white';
    return 'bg-gray-600 text-white';
  };

  const getIcon = () => {
    if (signal === 'ACHAT') return '📈';
    if (signal === 'VENTE') return '📉';
    return '➡️';
  };

  const getConfidenceColor = () => {
    if (confidence === 'Forte') return 'bg-yellow-600';
    if (confidence === 'Moyenne') return 'bg-yellow-700';
    return 'bg-gray-700';
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`badge-${signal.toLowerCase() === 'achat' ? 'achat' : signal.toLowerCase() === 'vente' ? 'vente' : 'neutre'} flex items-center gap-2`}>
        <span className="text-lg">{getIcon()}</span>
        <span>{signal}</span>
      </div>
      <div className={`badge-${confidence === 'Forte' ? 'strong' : confidence === 'Moyenne' ? 'medium' : 'weak'}`}>
        {confidence}
      </div>
      <div className="text-sm font-semibold text-gray-300">
        Score: {score}/100
      </div>
    </div>
  );
}
