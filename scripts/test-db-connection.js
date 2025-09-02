const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function testConnection() {
  try {
    console.log('🔍 Test de connexion à la base de données...');
    console.log('📋 Configuration:');
    console.log(`  - Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  - Port: ${process.env.DB_PORT || 5432}`);
    console.log(`  - Database: ${process.env.DB_NAME || 'bms_db'}`);
    console.log(`  - User: ${process.env.DB_USER || 'postgres'}`);
    console.log('');

    // Test de connexion
    const client = await pool.connect();
    console.log('✅ Connexion réussie !');

    // Test de requête simple
    const result = await client.query('SELECT version()');
    console.log('📊 Version PostgreSQL:', result.rows[0].version);

    // Vérifier si la table partenaires existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'partenaires'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Table "partenaires" existe');
      
      // Compter les enregistrements
      const countResult = await client.query('SELECT COUNT(*) FROM partenaires');
      console.log(`📊 Nombre de partenaires: ${countResult.rows[0].count}`);
    } else {
      console.log('❌ Table "partenaires" n\'existe pas');
      console.log('💡 Exécutez d\'abord: \\i scripts/create-partenariat-table.sql');
    }

    client.release();
    console.log('\n🎉 Test de connexion terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Vérifiez que PostgreSQL est démarré');
      console.log('  2. Vérifiez le port (défaut: 5432)');
      console.log('  3. Vérifiez que le service PostgreSQL est actif');
    } else if (error.code === '28P01') {
      console.log('\n💡 Erreur d\'authentification:');
      console.log('  1. Vérifiez le nom d\'utilisateur et mot de passe');
      console.log('  2. Vérifiez le fichier .env');
    } else if (error.code === '3D000') {
      console.log('\n💡 Base de données introuvable:');
      console.log('  1. Vérifiez le nom de la base de données');
      console.log('  2. Créez la base si elle n\'existe pas');
    }
  } finally {
    await pool.end();
  }
}

// Exécuter le test
testConnection();
