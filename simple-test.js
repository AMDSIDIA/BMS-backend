const { query, closeConnection } = require('./config/database');

async function simpleTest() {
  try {
    console.log('🧪 Test simple de la base de données');
    
    // Test de connexion simple
    const result = await query('SELECT NOW() as time');
    console.log('✅ Connexion réussie:', result.rows[0].time);
    
    // Vérifier les tables
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Tables disponibles:');
    tables.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Vérifier la structure de la table users
    const usersCols = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    console.log('👤 Colonnes de la table users:');
    usersCols.rows.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await closeConnection();
  }
}

simpleTest();
