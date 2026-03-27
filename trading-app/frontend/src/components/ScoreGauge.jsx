import React from 'react';

export default function ScoreGauge({ score, label, size = 'medium' }) {
  const radius = size === 'small' ? 30 : size === 'medium' ? 45 : 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 65) return '#10b981';
    if (score <= 35) return '#ef4444';
    return '#eab308';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={radius * 2 + 20} height={radius * 2 + 20} className="transform -rotate-90">
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          <circle
            cx={radius + 10}
            cy={radius + 10}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color }}>{score}</div>
            <div className="text-xs text-gray-400">/100</div>
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-300 text-center">{label}</p>
    </div>
  );
}
