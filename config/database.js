const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la base de données
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bms_db',
  user: process.env.DB_USER || 'bms_user',
  password: process.env.DB_PASSWORD || 'motdepasse_bms',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30 secondes
  connectionTimeoutMillis: 2000, // Timeout de connexion de 2 secondes
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
  console.log(`📊 Database: ${process.env.DB_NAME || 'bms_db'}`);
  console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  console.error('🔍 Error details:', {
    code: err.code,
    message: err.message,
    detail: err.detail
  });
  
  // En production, ne pas quitter le processus
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

// Fonction pour tester la connexion
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    
    console.log('✅ Database connection test successful');
    console.log(`🕐 Server time: ${result.rows[0].current_time}`);
    console.log(`📋 PostgreSQL version: ${result.rows[0].db_version.split(' ')[1]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
};

// Fonction pour initialiser la base de données
const initDatabase = async () => {
  try {
    console.log('🚀 Initializing database tables...');
    
    // Table des utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
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

    // Table des offres
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offres (
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

    // Table des répartitions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS repartitions (
        id SERIAL PRIMARY KEY,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        pole_lead VARCHAR(100),
        pole_associes VARCHAR(100),
        date_repartition DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table des modalités des pôles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modalites_poles (
        id SERIAL PRIMARY KEY,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        pole VARCHAR(100) NOT NULL,
        modalite VARCHAR(20) DEFAULT 'nouveau',
        date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        commentaire TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table des résultats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resultats (
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

    // Table des alertes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alertes (
        id SERIAL PRIMARY KEY,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        type_alerte VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        date_alerte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lu BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table des paramètres d'alertes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parametres_alertes (
        id SERIAL PRIMARY KEY,
        delai_montage_administratif INTEGER DEFAULT 72,
        delai_depot INTEGER DEFAULT 24,
        fuseau_horaire VARCHAR(10) DEFAULT 'UTC+0',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insérer les paramètres d'alertes par défaut s'ils n'existent pas
    await pool.query(`
      INSERT INTO parametres_alertes (id) 
      VALUES (1) 
      ON CONFLICT (id) DO NOTHING;
    `);

    // Table des recherches programmées
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scheduled_searches (
        id SERIAL PRIMARY KEY,
        utilisateur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        nom_recherche VARCHAR(255) NOT NULL,
        criteres_recherche TEXT NOT NULL,
        frequence VARCHAR(50) NOT NULL CHECK (frequence IN ('hourly', 'daily', 'weekly', 'monthly', 'custom')),
        prochaine_execution TIMESTAMP NOT NULL,
        actif BOOLEAN DEFAULT TRUE,
        custom_schedule JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Créer la table des fichiers TDR
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fichiers_tdr (
        id SERIAL PRIMARY KEY,
        nom_fichier VARCHAR(255) NOT NULL,
        type_mime VARCHAR(100) NOT NULL,
        taille BIGINT NOT NULL,
        contenu BYTEA NOT NULL,
        offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
        date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        version VARCHAR(50) DEFAULT '1.0'
      )
    `);

    // Ajouter la colonne fichiers_tdr_ids à la table offres si elle n'existe pas
    await pool.query(`
      ALTER TABLE offres 
      ADD COLUMN IF NOT EXISTS fichiers_tdr_ids INTEGER[] DEFAULT '{}'
    `);

    console.log('✅ Database tables initialized successfully');
    console.log('📋 Tables created: users, offres, repartitions, modalites_poles, resultats, alertes, parametres_alertes, scheduled_searches');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Fonction pour obtenir les statistiques de la base de données
const getDatabaseStats = async () => {
  try {
    const stats = {};
    
    // Compter les utilisateurs
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    stats.users = parseInt(usersCount.rows[0].count);
    
    // Compter les offres
    const offresCount = await pool.query('SELECT COUNT(*) FROM offres');
    stats.offres = parseInt(offresCount.rows[0].count);
    
    // Compter les répartitions
    const repartitionsCount = await pool.query('SELECT COUNT(*) FROM repartitions');
    stats.repartitions = parseInt(repartitionsCount.rows[0].count);
    
    // Compter les alertes non lues
    const alertesCount = await pool.query('SELECT COUNT(*) FROM alertes WHERE lu = FALSE');
    stats.alertesNonLues = parseInt(alertesCount.rows[0].count);
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return null;
  }
};

// Fonction pour nettoyer les anciennes données
const cleanupOldData = async (days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Supprimer les anciennes alertes lues
    const result = await pool.query(
      'DELETE FROM alertes WHERE lu = TRUE AND date_alerte < $1',
      [cutoffDate]
    );
    
    console.log(`🧹 Cleaned up ${result.rowCount} old alerts`);
    return result.rowCount;
  } catch (error) {
    console.error('❌ Error cleaning up old data:', error);
    return 0;
  }
};

// Fonction pour fermer proprement la connexion
const closeConnection = async () => {
  try {
    await pool.end();
    console.log('✅ Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

module.exports = {
  pool,
  initDatabase,
  testConnection,
  getDatabaseStats,
  cleanupOldData,
  closeConnection,
  query: (text, params) => pool.query(text, params),
};
