const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bms_db'
});

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration...');
    
    // Lire le fichier SQL
    const migrationPath = path.join(__dirname, 'migrations', 'add_custom_schedule.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Exécution de la migration...');
    
    // Exécuter la migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration exécutée avec succès !');
    console.log('📊 Résultats:', result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
