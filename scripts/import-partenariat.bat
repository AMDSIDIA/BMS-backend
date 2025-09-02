@echo off
echo ========================================
echo    IMPORT PARTENAIRES BMS
echo ========================================
echo.

REM Vérifier si le fichier Excel est fourni
if "%~1"=="" (
    echo ❌ Erreur: Veuillez spécifier le chemin du fichier Excel
    echo.
    echo Usage: import-partenariat.bat <chemin_vers_fichier_excel>
    echo Exemple: import-partenariat.bat C:\Users\User\Desktop\partenariat.xlsx
    echo.
    pause
    exit /b 1
)

REM Vérifier que le fichier existe
if not exist "%~1" (
    echo ❌ Erreur: Le fichier "%~1" n'existe pas
    echo.
    pause
    exit /b 1
)

echo 📁 Fichier Excel: %~1
echo.

REM Vérifier l'extension du fichier
if not "%~x1"==".xlsx" (
    echo ⚠️  Attention: Le fichier doit avoir l'extension .xlsx
    echo.
)

echo 🚀 Démarrage de l'import...
echo.

REM Exécuter le script Node.js
node import-partenariat.js "%~1"

echo.
echo ✅ Import terminé !
pause
