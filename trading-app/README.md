# Trading Signals - Application d'Analyse Algorithmique

Une application web complète pour les **signaux de trading algorithmiques** basée sur la **Bourse de Casablanca**. 100% algorithmique, sans IA générative.

## 🎯 Fonctionnalités

### Indicateurs Techniques (6)
- **RSI** (14) - Momentum
- **MACD** (12,26,9) - Tendance et momentum
- **Moyennes Mobiles** (20/50) - Tendance
- **Stochastique** (14,3,3) - Momentum
- **VWAP** - Volume et prix moyen pondéré

### Analyse Fondamentale
- P/E Ratio (Price/Earnings)
- P/B Ratio (Price/Book)
- Rendement Dividende
- Croissance Chiffre d'Affaires
- Marge Nette

### Analyse des Actualités
- Scraping NewsAPI (français)
- Analyse de sentiment NLP algorithmique
- Classification automatique (Positif/Négatif/Neutre)

### Signaux Finaux
- Score 0-100
- 3 niveaux de signal: **ACHAT**, **NEUTRE**, **VENTE**
- 3 niveaux de confiance: **Forte**, **Moyenne**, **Faible**

### Pondération du Score
- 🔵 **Technique**: 50%
- 🟣 **Fondamental**: 30%
- 🟠 **Actualités**: 20%

## 📋 Stack Technique

### Backend
- **Framework**: Express.js (Node.js)
- **Base de données**: SQLite + Prisma ORM
- **Indicateurs**: `technicalindicators` (npm)
- **Scraping**: Axios + Cheerio
- **Actualités**: NewsAPI.org
- **NLP**: `sentiment` (librairie légère)
- **Tâches planifiées**: `node-cron` (15 min)
- **Auth**: JWT (7 jours)

### Frontend
- **Framework**: React 18
- **Router**: React Router v6
- **Styles**: Tailwind CSS
- **Graphiques**: Recharts
- **HTTP Client**: Axios

## 🚀 Installation

### 1. Cloner et installer les dépendances

```bash
cd trading-app

# Backend
cd backend
npm install

# Frontend (dans un autre terminal)
cd ../frontend
npm install
```

### 2. Configuration

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Remplir les variables:
```
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
NEWS_API_KEY=""  # Optionnel, obtenir une clé gratuite sur https://newsapi.org
```

#### Frontend (.env)
```bash
cd ../frontend
# Le .env est déjà configuré par défaut
```

### 3. Initialiser la base de données

```bash
cd backend

# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate

# Seeder la base avec les stocks
npm run prisma:seed
```

## 🏃 Lancer l'application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
# API: http://localhost:3001
# Health check: http://localhost:3001/health
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
# App: http://localhost:3000
```

## 🔐 Authentification

### Compte de Démonstration
```
Email: demo@trading.ma
Mot de passe: demo123
```

## 📊 Utilisation

### Dashboard
Vue d'ensemble avec:
- Nombre de signaux ACHAT/VENTE/NEUTRE
- Score moyen global
- Distribution des signaux

### Actions
Liste de toutes les actions cotées avec:
- Dernier signal
- Scores technique/fondamental/actualités
- Filtres par signal

### Détail d'une Action
- Graphique candlestick (30 derniers jours)
- 6 indicateurs techniques détaillés
- Données fondamentales
- Actualités avec analyse de sentiment
- Historique des signaux

### Alertes
Créer des alertes personnalisées:
- Signal ACHAT/VENTE
- Score > 70 ou < 30
- Confiance Forte détectée

## 🔄 Mises à Jour Automatiques

Le système met à jour **tous les signaux toutes les 15 minutes** via un cron job:

1. Scrape les cours de la Bourse de Casablanca
2. Calcule les 6 indicateurs techniques
3. Récupère les actualités du jour
4. Analyse le sentiment des actualités
5. Calcule le signal final (pondération)
6. Sauvegarde en base de données

**Données en cache**: Si le scraping échoue, les données du fallback JSON sont utilisées avec un badge "Données en cache".

## 📁 Structure du Projet

```
trading-app/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stocks.js
│   │   ├── signals.js
│   │   └── alerts.js
│   ├── services/
│   │   ├── scraper.js
│   │   ├── indicators.js
│   │   ├── fundamentals.js
│   │   ├── newsService.js
│   │   ├── signalEngine.js
│   │   └── scheduler.js
│   ├── data/
│   │   └── fallback.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Stocks.jsx
│   │   │   ├── StockDetail.jsx
│   │   │   └── Alerts.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SignalBadge.jsx
│   │   │   ├── IndicatorRow.jsx
│   │   │   ├── PriceChart.jsx
│   │   │   ├── ScoreGauge.jsx
│   │   │   ├── SignalTable.jsx
│   │   │   └── NewsPanel.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   └── public/
│       └── index.html
│
└── README.md
```

## 🔌 API Endpoints

### Auth
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription

### Stocks
- `GET /api/stocks` - Toutes les actions
- `GET /api/stocks/:symbol` - Détails d'une action
- `GET /api/stocks/:symbol/chart` - Graphique

### Signals
- `GET /api/signals` - Tous les signaux
- `GET /api/signals/:symbol` - Signal d'une action
- `GET /api/signals/:symbol/history` - Historique

### Alerts
- `GET /api/alerts` - Mes alertes
- `POST /api/alerts` - Créer une alerte
- `PATCH /api/alerts/:id` - Modifier une alerte
- `DELETE /api/alerts/:id` - Supprimer une alerte

Tous les endpoints sauf auth nécessitent un token JWT dans le header:
```
Authorization: Bearer <token>
```

## 🌍 Données

### Bourse de Casablanca
Actions principales cotées:
- ATW (Attijariwafa bank)
- IAM (Maroc Telecom)
- BCP (Banque Centrale Populaire)
- CIH (CIH Bank)
- BMCE (BMCE Bank of Africa)
- SNI (Société Nationale d'Investissement)
- ITISSALAT (Itissalat Al-Maghrib)
- MASI (Maroc Assurance Crédit)
- STRUMA (Struma)
- AZERTY (Azerty)

### Actualités
Via **NewsAPI.org** (clé gratuite disponible)

## ⚠️ Disclaimer

Ces signaux sont fournis à titre **informatif uniquement** et ne constituent **pas une recommandation d'investissement**. L'analyse technique et fondamentale est basée sur des données historiques et actuelles.

**Risques**: Tout investissement en bourse comporte des risques. Consultez un professionnel avant de prendre toute décision d'investissement.

## 🛠️ Développement

### Structure des Services

#### Scraper (`services/scraper.js`)
Scrape la Bourse de Casablanca via Cheerio. Fallback sur données JSON statiques.

#### Indicateurs (`services/indicators.js`)
Calcule 6 indicateurs via `technicalindicators`. Retourne signal (bullish/bearish/neutral).

#### Fondamentaux (`services/fundamentals.js`)
Score de 0-100 basé sur PER, P/B, dividendes, croissance, marge.

#### News (`services/newsService.js`)
Récupère actualités NewsAPI. Analyse sentiment avec `sentiment` (NLP léger).

#### Signal Engine (`services/signalEngine.js`)
Combine les 3 scores avec pondération 50-30-20.

#### Scheduler (`services/scheduler.js`)
Cron job toutes les 15 min qui met à jour tous les signaux.

## 📝 TODO Futur

- [ ] Notifications email/SMS pour alertes
- [ ] Export des signaux en CSV/PDF
- [ ] Backtesting sur historique
- [ ] Graphiques avec plus d'indicateurs
- [ ] Comparaison actions
- [ ] API WebSocket pour temps réel
- [ ] Dashboard admin

## 📞 Support

Pour toute question ou bug, ouvrir un issue.

---

**Made with ❤️ for Casablanca Stock Exchange**
