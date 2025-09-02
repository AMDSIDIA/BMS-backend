const { Pool } = require('pg');

// Configuration de la base de données
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bms_db'
});

async function checkAndCreateTable() {
  try {
    console.log('🔍 Vérification de la table scheduled_searches...');
    
    // Vérifier si la table existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scheduled_searches'
      );
    `);
    
    if (!checkResult.rows[0].exists) {
      console.log('📋 Table scheduled_searches non trouvée, création en cours...');
      
      // Créer la table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS scheduled_searches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          keywords TEXT NOT NULL,
          frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
          custom_schedule TEXT,
          last_run TIMESTAMP,
          next_run TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ Table scheduled_searches créée avec succès');
    } else {
      console.log('✅ Table scheduled_searches existe déjà');
    }
    
    // Vérifier la structure de la table
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_searches' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Structure de la table scheduled_searches:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification/création de la table:', error);
  } finally {
    await pool.end();
  }
}

checkAndCreateTable();
