const { pool } = require('./config/database');

async function updateScheduledSearchesTable() {
  try {
    console.log('🔧 Mise à jour de la table scheduled_searches...');

    // 1. Ajouter la colonne custom_schedule si elle n'existe pas
    console.log('1️⃣ Ajout de la colonne custom_schedule...');
    await pool.query(`
      ALTER TABLE scheduled_searches 
      ADD COLUMN IF NOT EXISTS custom_schedule JSONB
    `);
    console.log('✅ Colonne custom_schedule ajoutée');

    // 2. Mettre à jour les valeurs existantes de fréquence d'abord
    console.log('2️⃣ Mise à jour des valeurs de fréquence existantes...');
    await pool.query(`
      UPDATE scheduled_searches 
      SET frequence = CASE 
        WHEN frequence = 'quotidien' THEN 'daily'
        WHEN frequence = 'hebdomadaire' THEN 'weekly'
        WHEN frequence = 'mensuel' THEN 'monthly'
        ELSE frequence
      END
      WHERE frequence IN ('quotidien', 'hebdomadaire', 'mensuel')
    `);
    console.log('✅ Valeurs de fréquence mises à jour');

    // 3. Mettre à jour les contraintes de fréquence
    console.log('3️⃣ Mise à jour des contraintes de fréquence...');
    
    // Supprimer l'ancienne contrainte
    await pool.query(`
      ALTER TABLE scheduled_searches 
      DROP CONSTRAINT IF EXISTS scheduled_searches_frequence_check
    `);
    
    // Ajouter la nouvelle contrainte
    await pool.query(`
      ALTER TABLE scheduled_searches 
      ADD CONSTRAINT scheduled_searches_frequence_check 
      CHECK (frequence IN ('hourly', 'daily', 'weekly', 'monthly', 'custom'))
    `);
    console.log('✅ Contraintes de fréquence mises à jour');

    // 4. Vérifier la structure finale
    console.log('4️⃣ Vérification de la structure finale...');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'scheduled_searches' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure finale de la table scheduled_searches:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n🎉 Table scheduled_searches mise à jour avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter la mise à jour
updateScheduledSearchesTable();
