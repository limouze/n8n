const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const buildPrompt = (symbol, name, currentPrice, volume) => `
Tu es un analyste financier expert de la Bourse de Casablanca.
Analyse l'action ${name} (${symbol}), cours actuel : ${currentPrice} MAD, volume : ${volume}.

Réponds UNIQUEMENT en JSON valide sans markdown, avec cette structure exacte :
{
  "score": <0-100>,
  "signal": "<ACHAT|VENTE|NEUTRE>",
  "analyse_technique": {
    "resume": "<string>",
    "indicateurs": [
      {"label": "RSI (14)", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "MACD", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "MM 20j", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "MM 50j", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "Bollinger", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "Volume", "value": "<string>", "signal": "<bullish|bearish|neutral>"}
    ]
  },
  "analyse_fondamentale": {
    "resume": "<string>",
    "indicateurs": [
      {"label": "PER", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "P/B Ratio", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "Dividende", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "Croissance CA", "value": "<string>", "signal": "<bullish|bearish|neutral>"},
      {"label": "Marge nette", "value": "<string>", "signal": "<bullish|bearish|neutral>"}
    ]
  },
  "analyse_news": {
    "sentiment": "<Positif|Négatif|Neutre>",
    "score_sentiment": <0-100>,
    "actualites": [
      {"titre": "<string>", "impact": "<Positif|Négatif|Neutre>", "date": "<string>"}
    ]
  },
  "risques": ["<string>", "<string>", "<string>"],
  "opportunites": ["<string>", "<string>", "<string>"],
  "objectif_prix": "<string en MAD>",
  "horizon": "<Court terme|Moyen terme|Long terme>"
}`;

async function analyzeStock(symbol, name, currentPrice, volume) {
  const prompt = buildPrompt(symbol, name, currentPrice, volume);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text.trim();

  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  } else {
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = content.substring(firstBrace, lastBrace + 1);
    }
  }

  return JSON.parse(jsonStr);
}

module.exports = { analyzeStock };
