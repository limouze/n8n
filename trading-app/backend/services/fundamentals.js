const scoreFundamental = (fundamental) => {
  if (!fundamental) return 50;

  let score = 50;

  // PER scoring (Price Earnings Ratio)
  // Lower PER = potentially undervalued
  if (fundamental.per < 12) score += 15;
  else if (fundamental.per < 15) score += 10;
  else if (fundamental.per > 25) score -= 10;
  else if (fundamental.per > 20) score -= 5;

  // P/B Ratio scoring
  if (fundamental.pbRatio < 1.5) score += 10;
  else if (fundamental.pbRatio > 3) score -= 5;

  // Dividend yield
  if (fundamental.dividende >= 6) score += 15;
  else if (fundamental.dividende >= 4) score += 10;
  else if (fundamental.dividende >= 2) score += 5;
  else if (fundamental.dividende < 1) score -= 5;

  // Revenue growth
  if (fundamental.croissanceCA > 8) score += 15;
  else if (fundamental.croissanceCA > 5) score += 10;
  else if (fundamental.croissanceCA > 2) score += 5;
  else if (fundamental.croissanceCA < 0) score -= 10;

  // Net margin
  if (fundamental.margeNette > 25) score += 15;
  else if (fundamental.margeNette > 20) score += 10;
  else if (fundamental.margeNette > 15) score += 5;
  else if (fundamental.margeNette < 10) score -= 10;

  return Math.min(100, Math.max(0, score));
};

const getFundamentalDetails = (fundamental) => {
  if (!fundamental) {
    return {
      per: 'N/A',
      pbRatio: 'N/A',
      dividende: 'N/A',
      croissanceCA: 'N/A',
      margeNette: 'N/A'
    };
  }

  return {
    per: fundamental.per.toFixed(2),
    pbRatio: fundamental.pbRatio.toFixed(2),
    dividende: fundamental.dividende.toFixed(2),
    croissanceCA: fundamental.croissanceCA.toFixed(2),
    margeNette: fundamental.margeNette.toFixed(2)
  };
};

module.exports = {
  scoreFundamental,
  getFundamentalDetails
};
