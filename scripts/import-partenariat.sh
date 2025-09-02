#!/bin/bash

echo "========================================"
echo "    IMPORT PARTENAIRES BMS"
echo "========================================"
echo

# Vérifier si le fichier Excel est fourni
if [ $# -eq 0 ]; then
    echo "❌ Erreur: Veuillez spécifier le chemin du fichier Excel"
    echo
    echo "Usage: ./import-partenariat.sh <chemin_vers_fichier_excel>"
    echo "Exemple: ./import-partenariat.sh ./partenariat.xlsx"
    echo
    exit 1
fi

# Vérifier que le fichier existe
if [ ! -f "$1" ]; then
    echo "❌ Erreur: Le fichier \"$1\" n'existe pas"
    echo
    exit 1
fi

echo "📁 Fichier Excel: $1"
echo

# Vérifier l'extension du fichier
if [[ "$1" != *.xlsx ]]; then
    echo "⚠️  Attention: Le fichier doit avoir l'extension .xlsx"
    echo
fi

echo "🚀 Démarrage de l'import..."
echo

# Exécuter le script Node.js
node import-partenariat.js "$1"

echo
echo "✅ Import terminé !"
