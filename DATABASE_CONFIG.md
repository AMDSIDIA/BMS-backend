# Configuration de la Base de Données BMS

## 🗄️ Vue d'ensemble

Le système BMS utilise PostgreSQL comme base de données principale avec une architecture modulaire et évolutive.

## 📊 Structure des Tables

### 1. **Table `users`**
```sql
CREATE TABLE users (
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
```

**Rôles disponibles :**
- `s_admin` - Super Administrateur
- `admin` - Administrateur
- `charge_ajout_offre` - Chargé d'ajout d'offre
- `cma` - Chargé de Montage Administratif
- `cmt` - Chargé de Montage Technique
- `user` - Utilisateur standard

### 2. **Table `offres`**
```sql
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
```

**Statuts possibles :**
- `en_attente` - En attente de validation
- `approuvee` - Offre approuvée
- `rejetee` - Offre rejetée
- `en_cours` - En cours de traitement

### 3. **Table `repartitions`**
```sql
CREATE TABLE repartitions (
  id SERIAL PRIMARY KEY,
  offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
  pole_lead VARCHAR(100),
  pole_associes VARCHAR(100),
  date_repartition DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. **Table `modalites_poles`**
```sql
CREATE TABLE modalites_poles (
  id SERIAL PRIMARY KEY,
  offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
  pole VARCHAR(100) NOT NULL,
  modalite VARCHAR(20) DEFAULT 'nouveau',
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  commentaire TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Modalités possibles :**
- `nouveau` - Offre nouvellement créée (bleu)
- `montee` - Offre préparée et montée (vert)
- `deposee` - Offre soumise (jaune)
- `gagnee` - Offre remportée (violet)
- `annulee` - Offre abandonnée (rouge)

### 5. **Table `resultats`**
```sql
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
```

**Résultats possibles :**
- `en_cours` - En cours de traitement
- `deposee` - Offre déposée
- `gagnee` - Offre gagnée
- `perdue` - Offre perdue

### 6. **Table `alertes`**
```sql
CREATE TABLE alertes (
  id SERIAL PRIMARY KEY,
  offre_id INTEGER REFERENCES offres(id) ON DELETE CASCADE,
  type_alerte VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  date_alerte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Types d'alertes :**
- `montage_administratif` - Alerte 72h avant montage administratif
- `depot` - Alerte 24h avant dépôt
- `systeme` - Alerte système

### 7. **Table `parametres_alertes`**
```sql
CREATE TABLE parametres_alertes (
  id SERIAL PRIMARY KEY,
  delai_montage_administratif INTEGER DEFAULT 72,
  delai_depot INTEGER DEFAULT 24,
  fuseau_horaire VARCHAR(10) DEFAULT 'UTC+0',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Variables d'environnement requises

```env
# Configuration de la base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bms_db
DB_USER=bms_user
DB_PASSWORD=motdepasse_bms
```

### Pool de connexions

```javascript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bms_db',
  user: process.env.DB_USER || 'bms_user',
  password: process.env.DB_PASSWORD || 'motdepasse_bms',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Nombre maximum de connexions
  idleTimeoutMillis: 30000, // Timeout inactif
  connectionTimeoutMillis: 2000, // Timeout de connexion
});
```

## 🧪 Tests et Validation

### Script de test automatique

```bash
# Tester la configuration de la base de données
npm run test-db

# Ou directement
node test-database.js
```

### Tests manuels

```bash
# Se connecter à PostgreSQL
psql -h localhost -p 5432 -U bms_user -d bms_db

# Vérifier les tables
\dt

# Vérifier les paramètres d'alertes
SELECT * FROM parametres_alertes;

# Vérifier les statistiques
SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM offres) as offres_count,
  (SELECT COUNT(*) FROM repartitions) as repartitions_count;
```

## 📈 Fonctionnalités Avancées

### 1. **Statistiques automatiques**
```javascript
const stats = await getDatabaseStats();
// Retourne: { users, offres, repartitions, alertesNonLues }
```

### 2. **Nettoyage automatique**
```javascript
const cleanedCount = await cleanupOldData(30); // Nettoyer les données de plus de 30 jours
```

### 3. **Test de connexion**
```javascript
const isConnected = await testConnection();
// Retourne true/false selon l'état de la connexion
```

## 🔍 Dépannage

### Erreurs courantes

#### 1. **ECONNREFUSED**
```
❌ Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solutions :**
- Vérifiez que PostgreSQL est démarré
- Vérifiez le port dans la configuration
- Vérifiez les paramètres de connexion

#### 2. **28P01 - Invalid password**
```
❌ Error: password authentication failed
```
**Solutions :**
- Vérifiez le mot de passe dans .env
- Réinitialisez le mot de passe de l'utilisateur
- Vérifiez les permissions

#### 3. **3D000 - Database does not exist**
```
❌ Error: database "bms_db" does not exist
```
**Solutions :**
- Créez la base de données
- Vérifiez le nom dans .env
- Vérifiez les permissions utilisateur

### Commandes de récupération

```sql
-- Se connecter en tant que postgres
sudo -u postgres psql

-- Créer la base de données
CREATE DATABASE bms_db;

-- Créer l'utilisateur
CREATE USER bms_user WITH PASSWORD 'motdepasse_bms';

-- Accorder les permissions
GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;

-- Se connecter à la base
\c bms_db

-- Accorder les permissions sur le schéma
GRANT ALL ON SCHEMA public TO bms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bms_user;
```

## 🚀 Scripts Utiles

### Initialisation complète
```bash
# 1. Créer le fichier .env
./create-env.bat  # Windows
./create-env.sh   # Linux/Mac

# 2. Tester la configuration
npm run test-db

# 3. Initialiser les tables
npm run init-db

# 4. Démarrer le serveur
npm run dev
```

### Maintenance
```bash
# Nettoyer les anciennes données
npm run cleanup

# Vérifier les statistiques
node -e "require('./config/database').getDatabaseStats().then(console.log)"
```

## 📚 Ressources

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Node.js pg](https://node-postgres.com/)
- [Pool de connexions](https://node-postgres.com/apis/pool)

---

*Documentation mise à jour le : $(date)*
