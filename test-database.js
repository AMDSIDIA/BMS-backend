#!/usr/bin/env node

/**
 * Script de test pour la configuration de la base de données BMS
 * Usage: node test-database.js
 */

const { testConnection, initDatabase, getDatabaseStats, closeConnection } = require('./config/database');

async function testDatabase() {
  console.log('🧪 Test de la configuration de la base de données BMS');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Connexion à la base de données
    console.log('\n📡 Test 1: Connexion à la base de données');
    const connectionTest = await testConnection();
    
    if (!connectionTest) {
      console.error('❌ Échec du test de connexion');
      process.exit(1);
    }
    
    // Test 2: Initialisation des tables
    console.log('\n🏗️  Test 2: Initialisation des tables');
    await initDatabase();
    
    // Test 3: Statistiques de la base de données
    console.log('\n📊 Test 3: Statistiques de la base de données');
    const stats = await getDatabaseStats();
    
    if (stats) {
      console.log('📈 Statistiques actuelles:');
      console.log(`   👥 Utilisateurs: ${stats.users}`);
      console.log(`   📋 Offres: ${stats.offres}`);
      console.log(`   🔄 Répartitions: ${stats.repartitions}`);
      console.log(`   🔔 Alertes non lues: ${stats.alertesNonLues}`);
    }
    
    // Test 4: Test des requêtes de base
    console.log('\n🔍 Test 4: Requêtes de base');
    const { query } = require('./config/database');
    
    // Test de sélection
    const testSelect = await query('SELECT 1 as test_value');
    console.log(`   ✅ SELECT test: ${testSelect.rows[0].test_value}`);
    
    // Test de la table des paramètres d'alertes
    const alertesParams = await query('SELECT * FROM parametres_alertes WHERE id = 1');
    if (alertesParams.rows.length > 0) {
      console.log('   ✅ Paramètres d\'alertes configurés');
      console.log(`      Délai montage administratif: ${alertesParams.rows[0].delai_montage_administratif}h`);
      console.log(`      Délai dépôt: ${alertesParams.rows[0].delai_depot}h`);
    }
    
    console.log('\n✅ Tous les tests de base de données ont réussi !');
    console.log('\n🎉 Configuration de la base de données BMS prête !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests de base de données:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Vérifiez que PostgreSQL est démarré');
      console.error('   2. Vérifiez les paramètres de connexion dans .env');
      console.error('   3. Créez la base de données et l\'utilisateur');
    } else if (error.code === '28P01') {
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Vérifiez le nom d\'utilisateur et mot de passe');
      console.error('   2. Créez l\'utilisateur bms_user avec le bon mot de passe');
    } else if (error.code === '3D000') {
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Créez la base de données bms_db');
      console.error('   2. Vérifiez le nom de la base de données dans .env');
    }
    
    process.exit(1);
  } finally {
    // Fermer proprement la connexion
    await closeConnection();
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testDatabase().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { testDatabase };
