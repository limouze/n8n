import React from 'react';

export default function IndicatorRow({ label, value, signal }) {
  const getSignalIcon = () => {
    if (signal === 'bullish') return { icon: '🔺', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (signal === 'bearish') return { icon: '🔻', color: 'text-red-500', bg: 'bg-red-500/10' };
    return { icon: '➡️', color: 'text-gray-400', bg: 'bg-gray-500/10' };
  };

  const { icon, color, bg } = getSignalIcon();

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gray-700/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded ${bg}`}>
          <span className={`text-lg ${color}`}>{icon}</span>
        </div>
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>
      <div className="text-right">
        <div className="font-mono text-white">{value}</div>
        <div className={`text-xs font-semibold ${color}`}>
          {signal === 'bullish' ? 'HAUSSIER' : signal === 'bearish' ? 'BAISSIER' : 'NEUTRE'}
        </div>
      </div>
    </div>
  );
}
