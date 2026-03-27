const computeFinalSignal = (indicators, fundamentalScore, newsScore) => {
  // Calculate technical score based on indicator signals
  let technicalScore = 0;
  let bullCount = 0;
  let bearCount = 0;

  const indList = [
    indicators.rsi,
    indicators.macd,
    indicators.mm20,
    indicators.mm50,
    indicators.stochastique,
    indicators.vwap
  ];

  indList.forEach(ind => {
    if (ind.signal === 'bullish') bullCount++;
    if (ind.signal === 'bearish') bearCount++;
  });

  // Technical score is percentage of bullish signals
  technicalScore = Math.round((bullCount / indList.length) * 100);

  // Weighted average: Technical 50%, Fundamental 30%, News 20%
  const finalScore = Math.round(
    (technicalScore * 0.50) +
    (fundamentalScore * 0.30) +
    (newsScore * 0.20)
  );

  // Determine signal
  let signal = 'NEUTRE';
  if (finalScore >= 65) signal = 'ACHAT';
  else if (finalScore <= 35) signal = 'VENTE';

  // Determine confidence
  let confidence = 'Faible';
  if (finalScore >= 75 || finalScore <= 25) confidence = 'Forte';
  else if (finalScore >= 60 || finalScore <= 40) confidence = 'Moyenne';

  // Reason based on dominant indicators
  let reason = '';
  const bullSignals = [];
  const bearSignals = [];

  if (indicators.rsi.signal === 'bullish') bullSignals.push('RSI bullish');
  if (indicators.rsi.signal === 'bearish') bearSignals.push('RSI bearish');

  if (indicators.macd.signal === 'bullish') bullSignals.push('MACD bullish');
  if (indicators.macd.signal === 'bearish') bearSignals.push('MACD bearish');

  if (indicators.mm20.signal === 'bullish') bullSignals.push('Prix > MM20');
  if (indicators.mm20.signal === 'bearish') bearSignals.push('Prix < MM20');

  if (indicators.mm50.signal === 'bullish') bullSignals.push('Prix > MM50');
  if (indicators.mm50.signal === 'bearish') bearSignals.push('Prix < MM50');

  if (signal === 'ACHAT') {
    reason = bullSignals.slice(0, 3).join(', ') || 'Signaux mixtes';
  } else if (signal === 'VENTE') {
    reason = bearSignals.slice(0, 3).join(', ') || 'Signaux mixtes';
  } else {
    reason = 'Pas de tendance claire';
  }

  return {
    score: finalScore,
    signal,
    confidence,
    technicalScore,
    fundamentalScore,
    newsScore,
    reason,
    bullCount,
    bearCount,
    neuCount: indList.length - bullCount - bearCount
  };
};

module.exports = {
  computeFinalSignal
};
