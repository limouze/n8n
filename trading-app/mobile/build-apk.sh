#!/bin/bash

# 📱 Script de compilation APK automatique
# Simplifie la création de l'APK pour Android

echo "🚀 Trading Signals - APK Builder"
echo "=================================="
echo ""

# Vérifier Node.js
echo "✓ Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé!"
    echo "Télécharge-le sur https://nodejs.org"
    exit 1
fi
echo "✓ Node.js trouvé: $(node -v)"
echo ""

# Vérifier npm
echo "✓ Vérification de npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé!"
    exit 1
fi
echo "✓ npm trouvé: $(npm -v)"
echo ""

# Installer EAS CLI si nécessaire
echo "✓ Installation de EAS CLI..."
npm install -g eas-cli
echo ""

# Se connecter à Expo
echo "✓ Connexion à Expo..."
echo "Tu vas être redirigé vers le navigateur pour te connecter"
eas login
echo ""

# Installer les dépendances
echo "✓ Installation des dépendances..."
npm install
echo ""

# Compiler l'APK
echo "🔨 Compilation de l'APK (cela peut prendre 10 minutes)..."
echo "Attends le message 'Build complete!' ..."
echo ""
eas build --platform android --profile preview
echo ""

echo "✅ Compilation terminée!"
echo ""
echo "📱 Instructions d'installation :"
echo "1. Le lien de téléchargement s'affiche ci-dessus"
echo "2. Télécharge le fichier .apk"
echo "3. Envoie-le sur ton téléphone (email, Telegram, etc.)"
echo "4. Clique sur le fichier .apk sur ton téléphone"
echo "5. Appuie sur INSTALLER"
echo "6. Accède à l'app !"
echo ""
echo "🔐 Compte de démo:"
echo "Email: demo@trading.ma"
echo "Mot de passe: demo123"
echo ""
echo "Bon trading ! 📈"
