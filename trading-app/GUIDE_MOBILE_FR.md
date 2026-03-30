# 📱 Guide Complet : Installation de l'App Mobile

**Comment installer l'app Trading Signals sur ton téléphone en 5 minutes** ⏱️

---

## 🎯 3 Façons d'Installer

### **Méthode 1 : Via l'App Expo (PLUS SIMPLE - RECOMMANDÉE)**

C'est la façon **la plus simple et rapide**. Aucune compilation nécessaire.

#### Étape 1 : Télécharger Expo
**Sur Android :**
1. Ouvre Google Play Store
2. Recherche **"Expo"** ou **"Expo Go"**
3. Appuie sur "Installer"

**Sur iPhone :**
1. Ouvre App Store
2. Recherche **"Expo"** ou **"Expo Go"**
3. Appuie sur "Télécharger"

#### Étape 2 : Démarrer le serveur
Sur ton **ordinateur** :

```bash
cd trading-app/mobile
npm install
npm start
```

Tu verras quelque chose comme :
```
Expo DevTools is running at http://localhost:19000
Opening on Android device or iOS...
```

Et surtout **un grand QR CODE** dans le terminal! 📱

#### Étape 3 : Scanner le QR Code

**Sur Android :**
1. Ouvre l'app **Expo**
2. Tape sur **"Scan QR code"**
3. Pointe la caméra sur le QR code
4. L'app charge automatiquement ! ✅

**Sur iPhone :**
1. Ouvre l'app **Expo**
2. Tape sur **"Scan QR code"** (en bas)
3. Pointe la caméra sur le QR code
4. L'app charge ! ✅

---

### **Méthode 2 : Installer un APK (Android Only)**

Pour avoir l'app **installée directement** sans besoin de l'app Expo.

#### Prérequis
- Un compte Expo gratuit : https://expo.dev
- 10-15 minutes (compilation en cloud)

#### Étapes

**1. Créer un compte Expo**
- Va sur https://expo.dev
- Clique "Sign Up"
- Remplis le formulaire

**2. Installer eas-cli**
```bash
npm install -g eas-cli
```

**3. Te connecter**
```bash
eas login
```
Rentre ton email et mot de passe Expo.

**4. Lancer la compilation**
```bash
cd trading-app/mobile
eas build --platform android --profile preview
```

**5. Attendre** (5-10 minutes)
- L'app se compile dans le cloud Expo
- Un lien de téléchargement s'affichera
- Ou tu verras : **"Build finished!"**

**6. Télécharger et installer**
```bash
# Utilise le lien donné par Expo, ou
eas build --platform android --status
```

- Télécharge le fichier `.apk`
- Envoie-le sur ton téléphone (email, Telegram, USB)
- Ouvre-le et appuie sur "Installer"
- ✅ C'est installé !

---

### **Méthode 3 : Compiler avec Android Studio (Avancé)**

Pour les développeurs expérimentés.

```bash
cd trading-app/mobile
npx react-native build-android
```

Nécessite Android Studio et le JDK.

---

## ⚙️ Configuration Avant de Lancer

### Vérifier que le Backend fonctionne

Avant de lancer l'app mobile, **le backend doit être démarré** :

```bash
cd trading-app/backend
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Tu devrais voir :
```
🚀 Trading Signals API running on port 3001
```

### Configuration de l'URL API

Dans `trading-app/mobile/app.json`, c'est déjà configuré :

```json
"extra": {
  "apiUrl": "http://localhost:3001/api"
}
```

**Si tu testes sur différents appareils :**

**Android :** Remplace `localhost` par `10.0.2.2`
```json
"extra": {
  "apiUrl": "http://10.0.2.2:3001/api"
}
```

**iPhone :** Garde `localhost`

---

## 🔐 Compte de Test

Une fois l'app lancée, utilise :

```
Email: demo@trading.ma
Mot de passe: demo123
```

---

## 📊 Qu'est-ce que tu verras

### Écran 1 : Connexion
- Entre ton email et mot de passe
- Un compte démo est pré-rempli

### Écran 2 : Tableau de Bord 📊
- 4 cartes avec stats (ACHAT/VENTE/NEUTRE/Score)
- Tous les signaux listés
- **Glisse vers le bas pour rafraîchir**

### Écran 3 : Actions 📈
- Toutes les actions cotées
- Filtre par signal (ACHAT, VENTE, NEUTRE)
- Clique sur une action pour plus de détails

### Écran 4 : Détail Action 🔍
- Graphique des prix
- 6 indicateurs techniques (RSI, MACD, MM20, MM50, Stochastique, VWAP)
- Données fondamentales (P/E, P/B, Dividendes, etc.)
- Actualités avec analyse de sentiment

### Écran 5 : Alertes 🔔
- Crée tes alertes personnalisées
- Active/désactive les alertes
- Reçois des notifications

---

## 🐛 Problèmes Courants & Solutions

### ❌ "Cannot connect to server"

**Problème :** L'app ne peut pas se connecter au backend.

**Solutions :**
1. Vérifier que le backend tourne : `npm run dev` dans `/backend`
2. Sur Android : Utiliser `10.0.2.2` au lieu de `localhost`
3. Sur iPhone : Utiliser l'adresse IP de ta machine : `http://192.168.x.x:3001/api`

### ❌ "Le QR code ne marche pas"

**Solutions :**
1. S'assurer d'être sur le **même réseau WiFi** que l'ordinateur
2. Redémarrer Expo : `npm start` à nouveau
3. Vider le cache Expo : `expo start -c`

### ❌ "Erreur de connexion (credentials)"

**Solution :**
- Utilise le compte démo : `demo@trading.ma` / `demo123`
- Sinon crée un compte via l'app web : `localhost:3000`

### ❌ "L'app crash au démarrage"

**Solutions :**
1. Vérifier les logs : Cherche les erreurs rouges dans le terminal
2. Réinstaller les dépendances :
   ```bash
   rm -rf node_modules
   npm install
   npm start
   ```

### ❌ "Token expiré - reconnexion obligatoire"

**C'est normal !** Les tokens durent 7 jours. Se reconnecter.

---

## 🚀 Étapes Rapides Résumées

### Pour tester avec Expo (5 min) :
```bash
# Terminal 1 : Backend
cd trading-app/backend && npm run dev

# Terminal 2 : Mobile
cd trading-app/mobile && npm install && npm start

# Téléphone : Scanner le QR code avec Expo
```

### Pour compiler un APK (20 min) :
```bash
cd trading-app/mobile
eas login
eas build --platform android --profile preview
# Télécharger l'APK
# Installer sur téléphone
```

---

## 💡 Conseils Pro

✅ **Toujours commencer avec Expo** - C'est le plus rapide
✅ **Utiliser un **vrai téléphone** - Les simulateurs peuvent être lents
✅ **Tester en WiFi** - Pas en données mobiles (sauf pour APK final)
✅ **Checker les logs** - `npm start` donne des infos utiles
✅ **Mettre à jour** - `npm update expo` régulièrement

---

## 📚 Ressources

- **Docs Expo** : https://docs.expo.dev
- **React Navigation** : https://reactnavigation.org
- **EAS Build** : https://docs.expo.dev/build/introduction/

---

## ✅ Checklist Avant de Lancer

- [ ] Backend installé et qui fonctionne
- [ ] `npm install` fait dans `/mobile`
- [ ] Expo app téléchargée sur le téléphone
- [ ] Sur le même réseau WiFi
- [ ] URL API correcte dans `app.json`
- [ ] Compte démo ready : `demo@trading.ma` / `demo123`

---

## 🎉 Prêt !

Tu es prêt ! Suis la **Méthode 1** ci-dessus et tu auras l'app en 5 minutes.

**Questions ?** Vérifie d'abord les problèmes courants ci-dessus.

**Bon trading ! 📈**
