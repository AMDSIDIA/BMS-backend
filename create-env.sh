#!/bin/bash

# Script pour créer le fichier .env avec les configurations de base de données

echo "Création du fichier .env pour BMS..."

# Vérifier si le fichier .env existe déjà
if [ -f ".env" ]; then
    echo "Le fichier .env existe déjà. Voulez-vous le remplacer ? (y/n)"
    read -r response
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        echo "Opération annulée."
        exit 0
    fi
fi

# Créer le fichier .env avec les configurations
cat > .env << EOF
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
EOF

echo "✅ Fichier .env créé avec succès !"
echo ""
echo "📋 Configuration de la base de données :"
echo "   - Host: localhost"
echo "   - Port: 5432"
echo "   - Database: bms_db"
echo "   - User: bms_user"
echo "   - Password: motdepasse_bms"
echo ""
echo "⚠️  N'oubliez pas de :"
echo "   1. Créer la base de données PostgreSQL"
echo "   2. Créer l'utilisateur bms_user"
echo "   3. Accorder les permissions nécessaires"
echo "   4. Modifier le JWT_SECRET en production"
echo ""
echo "🔧 Pour créer la base de données, exécutez :"
echo "   psql -U postgres -c \"CREATE DATABASE bms_db;\""
echo "   psql -U postgres -c \"CREATE USER bms_user WITH PASSWORD 'motdepasse_bms';\""
echo "   psql -U postgres -c \"GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;\""
