const axios = require('axios');
const Sentiment = require('sentiment');

const analyzer = new Sentiment();

const fetchNews = async (stockName) => {
  if (!process.env.NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not configured, returning empty news');
    return [];
  }

  try {
    const query = encodeURIComponent(`${stockName} Maroc OR ${stockName} stock OR ${stockName} trading`);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=fr&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`;

    const { data } = await axios.get(url, { timeout: 8000 });

    return data.articles || [];
  } catch (error) {
    console.error(`Failed to fetch news for ${stockName}:`, error.message);
    return [];
  }
};

const analyzeSentimentOfText = (text) => {
  if (!text) return { score: 0, comparative: 0 };
  return analyzer.analyze(text);
};

const analyzeNewsArticles = (articles) => {
  if (!articles || articles.length === 0) {
    return {
      sentiment: 'Neutre',
      sentimentScore: 50,
      totalScore: 0,
      articles: []
    };
  }

  let totalScore = 0;
  const analyzed = articles.map(article => {
    const fullText = (article.title || '') + ' ' + (article.description || '');
    const result = analyzeSentimentOfText(fullText);

    totalScore += result.score;

    let impact = 'Neutre';
    if (result.score > 1) impact = 'Positif';
    else if (result.score < -1) impact = 'Négatif';

    return {
      titre: article.title || 'Sans titre',
      source: article.source?.name || 'Inconnu',
      date: article.publishedAt,
      url: article.url,
      impact,
      score: result.score,
      image: article.urlToImage
    };
  });

  const sentiment = totalScore > 2 ? 'Positif' : totalScore < -2 ? 'Négatif' : 'Neutre';
  const sentimentScore = Math.min(100, Math.max(0, 50 + totalScore * 5));

  return {
    sentiment,
    sentimentScore: Math.round(sentimentScore),
    totalScore,
    articles: analyzed
  };
};

module.exports = {
  fetchNews,
  analyzeNewsArticles,
  analyzeSentimentOfText
};
