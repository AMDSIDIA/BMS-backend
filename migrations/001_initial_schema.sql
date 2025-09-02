-- Migration initiale pour BMS
-- Création des tables principales

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des offres
CREATE TABLE IF NOT EXISTS offres (
  id SERIAL PRIMARY KEY,
  intitule_offre VARCHAR(255) NOT NULL,
  bailleur VARCHAR(100),
  pays TEXT[],
  date_depot DATE,
  date_soumission_validation DATE,
  statut VARCHAR(20) DEFAULT 'en_attente',
  priorite VARCHAR(50),
  pole_lead VARCHAR(100),
  pole_associes VARCHAR(100),
  commentaire TEXT,
  tdr_file VARCHAR(255),
  lien_tdr VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des répartitions
CREATE TABLE IF NOT EXISTS repartitions (
  id SERIAL PRIMARY KEY,
  offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
  pole_lead VARCHAR(100),
  pole_associes VARCHAR(100),
  date_repartition DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_offres_statut ON offres(statut);
CREATE INDEX IF NOT EXISTS idx_offres_pole_lead ON offres(pole_lead);
CREATE INDEX IF NOT EXISTS idx_offres_date_depot ON offres(date_depot);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
