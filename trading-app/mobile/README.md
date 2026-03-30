# 📱 Trading Signals Mobile App

Une **application mobile native** pour les signaux de trading algorithmiques - **Bourse de Casablanca**.

Fonctionne sur **Android et iOS** avec React Native + Expo.

---

## 🚀 Installation Rapide

### Option 1️⃣ : Installer via l'App Expo (Plus simple - 2 minutes)

#### Étape 1 : Télécharger l'app Expo
- **Android** : Google Play Store → cherchez "Expo"
- **iOS** : App Store → cherchez "Expo Go"

#### Étape 2 : Démarrer le serveur de développement
```bash
cd trading-app/mobile
npm install
npm start
```

#### Étape 3 : Scanner le QR code
- Ouvrez l'app **Expo**
- Scannez le **code QR** qui s'affiche dans le terminal
- Voilà ! L'app charge automatiquement

---

### Option 2️⃣ : Compiler en APK (Android) - Installation directe

#### Prérequis
- Avoir un compte Expo gratuit : https://expo.dev
- Node.js installé

#### Étapes

**1. Créer un compte et se connecter**
```bash
npm install -g eas-cli
eas login  # Se connecter avec ses identifiants Expo
```

**2. Compiler l'APK**
```bash
cd trading-app/mobile
eas build --platform android --profile preview
```

**3. Attendre la compilation** (5-10 minutes)
- Expo compile l'app dans le cloud
- Vous recevrez un lien de téléchargement

**4. Télécharger et installer**
- Téléchargez le fichier **APK** sur votre téléphone
- Ouvrez-le pour installer
- ✅ L'app est installée !

---

### Option 3️⃣ : Compiler en IPA (iOS) - Installation sur iPhone

```bash
eas build --platform ios
```

_Nécessite un compte Apple Developer ($99/an)_

---

## 📋 Configuration

### Fichier `.env`

Créez un fichier `.env` à la racine de `mobile/` :

```
REACT_APP_API_URL=http://votre-serveur:3001/api
```

**Si vous testez en local :**
- Android : Remplacer `localhost` par `10.0.2.2`
- iOS : Garder `localhost:3001`

Dans `app.json`, c'est déjà configuré avec :
```json
"extra": {
  "apiUrl": "http://localhost:3001/api"
}
```

---

## 🎯 Fonctionnalités

### ✅ Écrans disponibles

1. **Login** 🔐
   - Connexion avec email/mot de passe
   - Compte démo inclus
   - Sauvegarde sécurisée du token

2. **Tableau de Bord** 📊
   - Vue d'ensemble des signaux
   - Statistiques (ACHAT/VENTE/NEUTRE)
   - Tous les signaux avec scores
   - Rafraîchir vers le bas

3. **Actions** 📈
   - Liste de toutes les actions
   - Filtrer par signal
   - Voir le score de chaque action
   - Toucher pour les détails

4. **Détail Action** 🔍
   - Graphique des prix
   - 6 indicateurs techniques
   - Données fondamentales
   - Actualités avec sentiment

5. **Alertes** 🔔
   - Créer des alertes personnalisées
   - Activer/désactiver les alertes
   - Supprimer les alertes
   - Voir l'historique

---

## 🛠️ Technologies

- **React Native** - Framework mobile
- **Expo** - Plateforme de déploiement
- **React Navigation** - Navigation entre écrans
- **Axios** - Requêtes HTTP
- **Expo Secure Store** - Stockage sécurisé du token

---

## 🔑 Compte de Démonstration

```
Email: demo@trading.ma
Mot de passe: demo123
```

---

## 📱 Tester sur différents appareils

### Simulateur Android
```bash
npm run android
```

### Simulateur iOS (Mac seulement)
```bash
npm run ios
```

### Web (pour tester rapidement)
```bash
npm run web
```

---

## 🐛 Résolution de Problèmes

### "L'app se crash au démarrage"
→ Vérifier que le backend est démarré : `npm run dev` dans `/backend`

### "Impossible de se connecter au serveur"
→ Sur Android, modifier `localhost` par `10.0.2.2` dans `app.json`

### "Token expiré"
→ Se reconnecter - le token dure 7 jours

### "L'Expo app ne trouve pas le QR code"
→ S'assurer d'être sur le même réseau WiFi

---

## 📦 Structure

```
mobile/
├── screens/
│   ├── LoginScreen.js
│   ├── DashboardScreen.js
│   ├── StocksScreen.js
│   ├── StockDetailScreen.js
│   └── AlertsScreen.js
├── App.js              # Navigation principale
├── api.js              # Connexion au backend
├── app.json            # Configuration Expo
├── package.json
└── README.md
```

---

## 🌐 Déployer sur les stores

### Google Play Store
```bash
eas build --platform android
# Puis uploader l'APK/AAB sur Google Play Console
```

### Apple App Store
```bash
eas build --platform ios
# Puis uploader sur TestFlight/App Store
```

_Documentations complètes : https://docs.expo.dev_

---

## 💡 Conseils

✅ **Tester d'abord avec Expo** - C'est plus rapide
✅ **Compiler un APK quand c'est stable** - Pour installation directe
✅ **Utiliser un appareil réel** - Les simulateurs peuvent être lents
✅ **Mettre à jour Expo régulièrement** - `npm update expo`

---

## ⚠️ Disclaimer

Ces signaux sont à titre **informatif uniquement**. Ne constituent pas une recommandation d'investissement.

**Risques**: Tout investissement comporte des risques. Consultez un professionnel.

---

## 📞 Support

Pour les problèmes avec Expo : https://docs.expo.dev
Pour les problèmes de l'app : Vérifier les logs avec `npm start`

**Happy Trading! 📈**
