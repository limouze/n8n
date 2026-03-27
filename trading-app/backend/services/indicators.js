const ti = require('technicalindicators');

const computeIndicators = (candles) => {
  if (!candles || candles.length < 50) {
    return {
      rsi: { value: '0.00', signal: 'neutral' },
      macd: { value: '0.00', signal: 'neutral' },
      mm20: { value: '0.00', signal: 'neutral' },
      mm50: { value: '0.00', signal: 'neutral' },
      stochastique: { value: 'K:0.0 D:0.0', signal: 'neutral' },
      vwap: { value: '0.00', signal: 'neutral' },
      bullCount: 0,
      bearCount: 0,
      neuCount: 3
    };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  let rsiSignal = 'neutral';
  let rsiValue = '0.00';
  try {
    const rsi = ti.RSI.calculate({ values: closes, period: 14 });
    if (rsi && rsi.length > 0) {
      rsiValue = rsi[rsi.length - 1].toFixed(2);
      rsiSignal = rsi[rsi.length - 1] > 70 ? 'bearish' : rsi[rsi.length - 1] < 30 ? 'bullish' : 'neutral';
    }
  } catch (e) {
    console.error('RSI calculation error:', e.message);
  }

  let macdSignal = 'neutral';
  let macdValue = '0.00';
  try {
    const macd = ti.MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });
    if (macd && macd.length > 0) {
      const macdLast = macd[macd.length - 1];
      macdValue = macdLast.histogram.toFixed(2);
      macdSignal = macdLast.histogram > 0 ? 'bullish' : 'bearish';
    }
  } catch (e) {
    console.error('MACD calculation error:', e.message);
  }

  let mm20Signal = 'neutral';
  let mm20Value = '0.00';
  try {
    const sma20 = ti.SMA.calculate({ values: closes, period: 20 });
    if (sma20 && sma20.length > 0) {
      mm20Value = sma20[sma20.length - 1].toFixed(2);
      mm20Signal = closes[closes.length - 1] > sma20[sma20.length - 1] ? 'bullish' : 'bearish';
    }
  } catch (e) {
    console.error('SMA20 calculation error:', e.message);
  }

  let mm50Signal = 'neutral';
  let mm50Value = '0.00';
  try {
    const sma50 = ti.SMA.calculate({ values: closes, period: 50 });
    if (sma50 && sma50.length > 0) {
      mm50Value = sma50[sma50.length - 1].toFixed(2);
      mm50Signal = closes[closes.length - 1] > sma50[sma50.length - 1] ? 'bullish' : 'bearish';
    }
  } catch (e) {
    console.error('SMA50 calculation error:', e.message);
  }

  let stochSignal = 'neutral';
  let stochValue = 'K:0.0 D:0.0';
  try {
    const stoch = ti.Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
      signalPeriod: 3
    });
    if (stoch && stoch.length > 0) {
      const stochLast = stoch[stoch.length - 1];
      stochValue = `K:${stochLast.k.toFixed(1)} D:${stochLast.d.toFixed(1)}`;
      stochSignal = stochLast.k > 80 ? 'bearish' : stochLast.k < 20 ? 'bullish' : 'neutral';
    }
  } catch (e) {
    console.error('Stochastic calculation error:', e.message);
  }

  let vwapSignal = 'neutral';
  let vwapValue = '0.00';
  try {
    const vwap = ti.VWAP.calculate({
      high: highs,
      low: lows,
      close: closes,
      volume: volumes
    });
    if (vwap && vwap.length > 0) {
      vwapValue = vwap[vwap.length - 1].toFixed(2);
      vwapSignal = closes[closes.length - 1] > vwap[vwap.length - 1] ? 'bullish' : 'bearish';
    }
  } catch (e) {
    console.error('VWAP calculation error:', e.message);
  }

  // Count signals
  const signals = [rsiSignal, macdSignal, mm20Signal, mm50Signal, stochSignal, vwapSignal];
  let bullCount = signals.filter(s => s === 'bullish').length;
  let bearCount = signals.filter(s => s === 'bearish').length;
  let neuCount = signals.filter(s => s === 'neutral').length;

  return {
    rsi: { value: rsiValue, signal: rsiSignal },
    macd: { value: macdValue, signal: macdSignal },
    mm20: { value: mm20Value, signal: mm20Signal },
    mm50: { value: mm50Value, signal: mm50Signal },
    stochastique: { value: stochValue, signal: stochSignal },
    vwap: { value: vwapValue, signal: vwapSignal },
    bullCount,
    bearCount,
    neuCount
  };
};

module.exports = {
  computeIndicators
};
