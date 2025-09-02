#!/usr/bin/env node

/**
 * Script de test complet pour l'application BMS
 * Teste la base de données, l'API et les fonctionnalités principales
 */

const { testConnection, initDatabase, getDatabaseStats, query, closeConnection } = require('./config/database');
const bcrypt = require('bcryptjs');

async function testCompleteApplication() {
  console.log('🧪 Test complet de l\'application BMS');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Base de données
    console.log('\n📡 Test 1: Base de données');
    const dbTest = await testConnection();
    if (!dbTest) {
      throw new Error('Échec de la connexion à la base de données');
    }
    console.log('✅ Base de données connectée');
    
    // Test 2: Initialisation des tables
    console.log('\n🏗️  Test 2: Initialisation des tables');
    await initDatabase();
    console.log('✅ Tables initialisées');
    
    // Test 3: Création d'un utilisateur de test
    console.log('\n👤 Test 3: Création d\'un utilisateur de test');
    const testUser = {
      email: 'test@bms.com',
      password: 'test123',
      nom: 'Test',
      prenom: 'Utilisateur',
      role: 'admin'
    };
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [testUser.email]);
    
    if (existingUser.rows.length === 0) {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await query(
        'INSERT INTO users (email, password_hash, nom, prenom, role) VALUES ($1, $2, $3, $4, $5)',
        [testUser.email, hashedPassword, testUser.nom, testUser.prenom, testUser.role]
      );
      console.log('✅ Utilisateur de test créé');
    } else {
      console.log('✅ Utilisateur de test existe déjà');
    }
    
    // Test 4: Création d'une offre de test
    console.log('\n📋 Test 4: Création d\'une offre de test');
    const testOffre = {
      intitule_offre: 'Offre de test BMS',
      bailleur: 'Banque Mondiale',
      pays: ['Mali', 'Sénégal'],
      date_depot: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
      statut: 'en_attente',
      priorite: 'Haute',
      pole_lead: 'Informatique',
      commentaire: 'Offre de test pour validation du système'
    };
    
    // Vérifier si l'offre existe déjà
    const existingOffre = await query('SELECT * FROM offres WHERE intitule_offre = $1', [testOffre.intitule_offre]);
    
    if (existingOffre.rows.length === 0) {
      await query(
        `INSERT INTO offres (
          intitule_offre, bailleur, pays, date_depot, statut, priorite, pole_lead, commentaire
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          testOffre.intitule_offre,
          testOffre.bailleur,
          testOffre.pays,
          testOffre.date_depot,
          testOffre.statut,
          testOffre.priorite,
          testOffre.pole_lead,
          testOffre.commentaire
        ]
      );
      console.log('✅ Offre de test créée');
    } else {
      console.log('✅ Offre de test existe déjà');
    }
    
    // Test 5: Statistiques de la base de données
    console.log('\n📊 Test 5: Statistiques de la base de données');
    const stats = await getDatabaseStats();
    if (stats) {
      console.log('📈 Statistiques actuelles:');
      console.log(`   👥 Utilisateurs: ${stats.users}`);
      console.log(`   📋 Offres: ${stats.offres}`);
      console.log(`   🔄 Répartitions: ${stats.repartitions}`);
      console.log(`   🔔 Alertes non lues: ${stats.alertesNonLues}`);
    }
    
    // Test 6: Test des paramètres d'alertes
    console.log('\n🔔 Test 6: Paramètres d\'alertes');
    const alertesParams = await query('SELECT * FROM parametres_alertes WHERE id = 1');
    if (alertesParams.rows.length > 0) {
      console.log('✅ Paramètres d\'alertes configurés:');
      console.log(`   Délai montage administratif: ${alertesParams.rows[0].delai_montage_administratif}h`);
      console.log(`   Délai dépôt: ${alertesParams.rows[0].delai_depot}h`);
      console.log(`   Fuseau horaire: ${alertesParams.rows[0].fuseau_horaire}`);
      console.log(`   Système actif: ${alertesParams.rows[0].active ? 'Oui' : 'Non'}`);
    }
    
    // Test 7: Test des requêtes complexes
    console.log('\n🔍 Test 7: Requêtes complexes');
    
    // Compter les offres par statut
    const offresParStatut = await query(`
      SELECT statut, COUNT(*) as count 
      FROM offres 
      GROUP BY statut 
      ORDER BY count DESC
    `);
    console.log('📊 Offres par statut:');
    offresParStatut.rows.forEach(row => {
      console.log(`   ${row.statut}: ${row.count}`);
    });
    
    // Compter les utilisateurs par rôle
    const usersParRole = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    console.log('👥 Utilisateurs par rôle:');
    usersParRole.rows.forEach(row => {
      console.log(`   ${row.role}: ${row.count}`);
    });
    
    console.log('\n✅ Tous les tests de l\'application ont réussi !');
    console.log('\n🎉 Application BMS prête à l\'utilisation !');
    console.log('\n📋 Informations de connexion:');
    console.log('   🌐 Frontend: http://localhost:3000');
    console.log('   🔧 Backend API: http://localhost:5000');
    console.log('   📊 Base de données: PostgreSQL (bms_db)');
    console.log('\n👤 Utilisateur de test:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Mot de passe: ${testUser.password}`);
    console.log(`   Rôle: ${testUser.role}`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests de l\'application:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    
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
  testCompleteApplication().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { testCompleteApplication };
