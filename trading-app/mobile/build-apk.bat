@echo off
REM 📱 Script de compilation APK automatique (Windows)
REM Simplifie la création de l'APK pour Android

echo.
echo 🚀 Trading Signals - APK Builder
echo ==================================
echo.

REM Vérifier Node.js
echo ✓ Verification de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installe!
    echo Telecharge-le sur https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js trouve: %NODE_VERSION%
echo.

REM Vérifier npm
echo ✓ Verification de npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas installe!
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✓ npm trouve: %NPM_VERSION%
echo.

REM Installer EAS CLI
echo ✓ Installation de EAS CLI...
call npm install -g eas-cli
echo.

REM Connexion Expo
echo ✓ Connexion a Expo...
echo Tu vas etre redirige vers le navigateur pour te connecter
call eas login
echo.

REM Installer dépendances
echo ✓ Installation des dependances...
call npm install
echo.

REM Compiler l'APK
echo 🔨 Compilation de l'APK (cela peut prendre 10 minutes)...
echo Attends le message 'Build complete!' ...
echo.
call eas build --platform android --profile preview
echo.

echo ✅ Compilation terminee!
echo.
echo 📱 Instructions d'installation :
echo 1. Le lien de telechargement s'affiche ci-dessus
echo 2. Telecharge le fichier .apk
echo 3. Envoie-le sur ton telephone (email, Telegram, etc.)
echo 4. Clique sur le fichier .apk sur ton telephone
echo 5. Appuie sur INSTALLER
echo 6. Acces a l'app !
echo.
echo 🔐 Compte de demo:
echo Email: demo@trading.ma
echo Mot de passe: demo123
echo.
echo Bon trading ! 📈
echo.
pause
