@echo off
echo Création du fichier .env pour BMS...

REM Vérifier si le fichier .env existe déjà
if exist ".env" (
    set /p response="Le fichier .env existe déjà. Voulez-vous le remplacer ? (y/n): "
    if /i not "%response%"=="y" (
        echo Opération annulée.
        pause
        exit /b
    )
)

REM Créer le fichier .env avec les configurations
(
echo # Configuration du serveur
echo PORT=5000
echo NODE_ENV=development
echo.
echo # Configuration CORS
echo FRONTEND_URL=http://localhost:3000
echo.
echo # Configuration JWT
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo.
echo # Configuration de la base de données PostgreSQL
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=bms_db
echo DB_USER=bms_user
echo DB_PASSWORD=motdepasse_bms
echo.
echo # Configuration des logs
echo LOG_LEVEL=info
) > .env

echo ✅ Fichier .env créé avec succès !
echo.
echo 📋 Configuration de la base de données :
echo    - Host: localhost
echo    - Port: 5432
echo    - Database: bms_db
echo    - User: bms_user
echo    - Password: motdepasse_bms
echo.
echo ⚠️  N'oubliez pas de :
echo    1. Créer la base de données PostgreSQL
echo    2. Créer l'utilisateur bms_user
echo    3. Accorder les permissions nécessaires
echo    4. Modifier le JWT_SECRET en production
echo.
echo 🔧 Pour créer la base de données, exécutez :
echo    psql -U postgres -c "CREATE DATABASE bms_db;"
echo    psql -U postgres -c "CREATE USER bms_user WITH PASSWORD 'motdepasse_bms';"
echo    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;"
echo.
pause
