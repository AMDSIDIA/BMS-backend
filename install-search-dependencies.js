#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installation des dépendances pour la recherche automatique...\n');

// Vérifier si on est dans le bon répertoire
if (!fs.existsSync('package.json')) {
  console.error('❌ Erreur: Ce script doit être exécuté depuis le répertoire backend/');
  process.exit(1);
}

// Dépendances à installer
const dependencies = [
  'axios@^1.6.0',
  'cheerio@^1.0.0-rc.12',
  'natural@^6.8.0',
  'node-cron@^3.0.3'
];

try {
  console.log('📦 Installation des dépendances...');
  
  // Installer chaque dépendance
  for (const dep of dependencies) {
    console.log(`Installing ${dep}...`);
    execSync(`npm install ${dep}`, { stdio: 'inherit' });
  }
  
  console.log('\n✅ Toutes les dépendances ont été installées avec succès !');
  
  // Vérifier l'installation
  console.log('\n🔍 Vérification de l\'installation...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const installedDeps = Object.keys(packageJson.dependencies || {});
  const requiredDeps = dependencies.map(dep => dep.split('@')[0]);
  
  const missingDeps = requiredDeps.filter(dep => !installedDeps.includes(dep));
  
  if (missingDeps.length === 0) {
    console.log('✅ Toutes les dépendances sont correctement installées');
  } else {
    console.log('⚠️  Dépendances manquantes:', missingDeps.join(', '));
  }
  
  console.log('\n🚀 Prochaines étapes :');
  console.log('1. Exécuter les migrations de base de données :');
  console.log('   psql -U postgres -d bms_db -f migrations/002_search_automation.sql');
  console.log('\n2. Configurer les variables d\'environnement (optionnel) :');
  console.log('   GOOGLE_API_KEY=your_google_api_key');
  console.log('   GOOGLE_CSE_ID=your_google_cse_id');
  console.log('   BING_API_KEY=your_bing_api_key');
  console.log('\n3. Redémarrer le serveur backend :');
  console.log('   npm run dev');
  
} catch (error) {
  console.error('❌ Erreur lors de l\'installation:', error.message);
  process.exit(1);
}
