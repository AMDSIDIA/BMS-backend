const { pool, closeConnection } = require('./config/database');

async function resetDatabase() {
  try {
    console.log('🔄 Réinitialisation de la base de données BMS');
    console.log('=' .repeat(50));
    
    // Supprimer toutes les tables existantes
    console.log('\n🗑️  Suppression des tables existantes...');
    
    const dropQueries = [
      'DROP TABLE IF EXISTS alertes CASCADE',
      'DROP TABLE IF EXISTS parametres_alertes CASCADE',
      'DROP TABLE IF EXISTS resultats CASCADE',
      'DROP TABLE IF EXISTS modalites_poles CASCADE',
      'DROP TABLE IF EXISTS repartitions CASCADE',
      'DROP TABLE IF EXISTS offres CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];
    
    for (const query of dropQueries) {
      await pool.query(query);
      console.log(`   ✅ ${query}`);
    }
    
    console.log('\n✅ Toutes les tables supprimées');
    
    // Recréer les tables
    console.log('\n🏗️  Recréation des tables...');
    
    // Table des utilisateurs
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        nom VARCHAR(100),
        prenom VARCHAR(100),
        sexe VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table users créée');
    
    // Table des offres
    await pool.query(`
      CREATE TABLE offres (
        id SERIAL PRIMARY KEY,
        intitule_offre VARCHAR(255) NOT NULL,
        bailleur VARCHAR(100),
        pays TEXT[],
        date_depot DATE,
        date_soumission_validation DATE,
        date_montage_administratif DATE,
        statut VARCHAR(20) DEFAULT 'en_attente',
        priorite VARCHAR(50),
        pole_lead VARCHAR(100),
        pole_associes VARCHAR(100),
        commentaire TEXT,
        tdr_file VARCHAR(255),
        lien_tdr VARCHAR(500),
        montant DECIMAL(15,2),
        type_offre VARCHAR(100),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table offres créée');
    
    // Table des répartitions
    await pool.query(`
      CREATE TABLE repartitions (
        id SERIAL PRIMARY KEY,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        pole_lead VARCHAR(100),
        pole_associes VARCHAR(100),
        date_repartition DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table repartitions créée');
    
    // Table des modalités des pôles
    await pool.query(`
      CREATE TABLE modalites_poles (
        id SERIAL PRIMARY KEY,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        pole VARCHAR(100) NOT NULL,
        modalite VARCHAR(20) DEFAULT 'nouveau',
        date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        commentaire TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table modalites_poles créée');
    
    // Table des résultats
    await pool.query(`
      CREATE TABLE resultats (
        id SERIAL PRIMARY KEY,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        pole VARCHAR(100) NOT NULL,
        resultat VARCHAR(20) DEFAULT 'en_cours',
        date_depot_prevu DATE,
        date_depot_effectif DATE,
        commentaire TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table resultats créée');
    
    // Table des alertes
    await pool.query(`
      CREATE TABLE alertes (
        id SERIAL PRIMARY KEY,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        type_alerte VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        date_alerte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lu BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table alertes créée');
    
    // Table des paramètres d'alertes
    await pool.query(`
      CREATE TABLE parametres_alertes (
        id SERIAL PRIMARY KEY,
        delai_montage_administratif INTEGER DEFAULT 72,
        delai_depot INTEGER DEFAULT 24,
        fuseau_horaire VARCHAR(10) DEFAULT 'UTC+0',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table parametres_alertes créée');
    
    // Insérer les paramètres d'alertes par défaut
    await pool.query(`
      INSERT INTO parametres_alertes (id) 
      VALUES (1) 
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('   ✅ Paramètres d\'alertes par défaut insérés');
    
    console.log('\n✅ Base de données réinitialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
  } finally {
    await closeConnection();
  }
}

resetDatabase();
