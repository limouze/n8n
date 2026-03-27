import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function PriceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-96 bg-gray-700/30 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  // Calculate candlestick data
  const candleData = data.map(candle => ({
    date: candle.date,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  }));

  // Color based on open/close
  const colors = candleData.map(candle =>
    candle.close >= candle.open ? '#10b981' : '#ef4444'
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Graphique des Prix (30 derniers jours)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={candleData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            interval={Math.floor(candleData.length / 8)}
          />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6'
            }}
            formatter={(value) => value?.toFixed(2)}
          />
          <Legend />
          <Bar
            dataKey="volume"
            fill="#3b82f6"
            yAxisId="right"
            opacity={0.3}
            name="Volume"
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Clôture"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
