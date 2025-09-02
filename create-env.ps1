# Script PowerShell pour créer le fichier .env avec les configurations de base de données

Write-Host "Création du fichier .env pour BMS..." -ForegroundColor Green

# Vérifier si le fichier .env existe déjà
if (Test-Path ".env") {
    $response = Read-Host "Le fichier .env existe déjà. Voulez-vous le remplacer ? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Opération annulée." -ForegroundColor Yellow
        exit
    }
}

# Contenu du fichier .env
$envContent = @"
# Configuration du serveur
PORT=5000
NODE_ENV=development

# Configuration CORS
FRONTEND_URL=http://localhost:3000

# Configuration JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Configuration de la base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bms_db
DB_USER=bms_user
DB_PASSWORD=motdepasse_bms

# Configuration des logs
LOG_LEVEL=info
"@

# Créer le fichier .env
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Fichier .env créé avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration de la base de données :" -ForegroundColor Cyan
Write-Host "   - Host: localhost" -ForegroundColor White
Write-Host "   - Port: 5432" -ForegroundColor White
Write-Host "   - Database: bms_db" -ForegroundColor White
Write-Host "   - User: bms_user" -ForegroundColor White
Write-Host "   - Password: motdepasse_bms" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  N'oubliez pas de :" -ForegroundColor Yellow
Write-Host "   1. Créer la base de données PostgreSQL" -ForegroundColor White
Write-Host "   2. Créer l'utilisateur bms_user" -ForegroundColor White
Write-Host "   3. Accorder les permissions nécessaires" -ForegroundColor White
Write-Host "   4. Modifier le JWT_SECRET en production" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Pour créer la base de données, exécutez :" -ForegroundColor Cyan
Write-Host "   psql -U postgres -c `"CREATE DATABASE bms_db;`"" -ForegroundColor White
Write-Host "   psql -U postgres -c `"CREATE USER bms_user WITH PASSWORD 'motdepasse_bms';`"" -ForegroundColor White
Write-Host "   psql -U postgres -c `"GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;`"" -ForegroundColor White
