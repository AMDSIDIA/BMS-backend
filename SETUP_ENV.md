# Configuration de l'environnement BMS

## 🚀 Création du fichier .env

### Option 1 : Utilisation des scripts automatiques

#### Pour Linux/Mac :
```bash
cd backend
chmod +x create-env.sh
./create-env.sh
```

#### Pour Windows (PowerShell) :
```powershell
cd backend
.\create-env.ps1
```

### Option 2 : Création manuelle

Créez un fichier `.env` dans le dossier `backend` avec le contenu suivant :

```env
# Configuration du serveur
PORT=5000
NODE_ENV=development

# Configuration CORS
FRONTEND_URL=http://localhost:3000

# Configuration JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Configuration de la base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bms_db
DB_USER=bms_user
DB_PASSWORD=motdepasse_bms

# Configuration des logs
LOG_LEVEL=info
```

## 🗄️ Configuration de la base de données PostgreSQL

### 1. Installation de PostgreSQL

#### Ubuntu/Debian :
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### CentOS/RHEL :
```bash
sudo yum install postgresql postgresql-server
sudo postgresql-setup initdb
sudo systemctl start postgresql
```

#### Windows :
- Téléchargez PostgreSQL depuis [postgresql.org](https://www.postgresql.org/download/windows/)
- Installez avec les paramètres par défaut

#### macOS :
```bash
brew install postgresql
brew services start postgresql
```

### 2. Création de la base de données

Connectez-vous à PostgreSQL en tant qu'utilisateur postgres :

```bash
sudo -u postgres psql
```

Puis exécutez les commandes suivantes :

```sql
-- Créer la base de données
CREATE DATABASE bms_db;

-- Créer l'utilisateur
CREATE USER bms_user WITH PASSWORD 'motdepasse_bms';

-- Accorder les permissions
GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;

-- Se connecter à la base de données
\c bms_db

-- Accorder les permissions sur le schéma public
GRANT ALL ON SCHEMA public TO bms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bms_user;

-- Quitter psql
\q
```

### 3. Vérification de la connexion

Testez la connexion avec les nouveaux paramètres :

```bash
psql -h localhost -p 5432 -U bms_user -d bms_db
```

## 🔧 Configuration du serveur

### 1. Installation des dépendances

```bash
cd backend
npm install
```

### 2. Variables d'environnement importantes

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `PORT` | Port du serveur | 5000 |
| `NODE_ENV` | Environnement | development |
| `DB_HOST` | Hôte PostgreSQL | localhost |
| `DB_PORT` | Port PostgreSQL | 5432 |
| `DB_NAME` | Nom de la base | bms_db |
| `DB_USER` | Utilisateur DB | bms_user |
| `DB_PASSWORD` | Mot de passe DB | motdepasse_bms |
| `JWT_SECRET` | Clé secrète JWT | À changer en production |
| `FRONTEND_URL` | URL du frontend | http://localhost:3000 |

### 3. Sécurité en production

⚠️ **IMPORTANT** : En production, modifiez obligatoirement :

- `JWT_SECRET` : Utilisez une clé secrète forte et unique
- `DB_PASSWORD` : Utilisez un mot de passe sécurisé
- `NODE_ENV` : Définissez à `production`
- `FRONTEND_URL` : URL de votre frontend en production

## 🧪 Test de la configuration

### 1. Test de la base de données

```bash
cd backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bms_db',
  user: process.env.DB_USER || 'bms_user',
  password: process.env.DB_PASSWORD || 'motdepasse_bms'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('✅ Connexion à la base de données réussie !');
    console.log('🕐 Heure du serveur:', res.rows[0].now);
  }
  pool.end();
});
"
```

### 2. Test du serveur

```bash
cd backend
npm start
```

Le serveur devrait démarrer sans erreur et afficher :
```
✅ Serveur démarré sur le port 5000
✅ Connexion à la base de données établie
```

## 🔍 Dépannage

### Erreur de connexion à la base de données

1. **Vérifiez que PostgreSQL est démarré :**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Vérifiez les paramètres de connexion :**
   ```bash
   psql -h localhost -p 5432 -U bms_user -d bms_db
   ```

3. **Vérifiez le fichier pg_hba.conf :**
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```
   Assurez-vous que la ligne suivante existe :
   ```
   local   all             all                                     md5
   ```

### Erreur de permissions

```sql
-- Se connecter en tant que postgres
sudo -u postgres psql

-- Réinitialiser les permissions
GRANT ALL PRIVILEGES ON DATABASE bms_db TO bms_user;
GRANT ALL ON SCHEMA public TO bms_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bms_user;
```

## 📚 Ressources supplémentaires

- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Configuration Node.js avec PostgreSQL](https://node-postgres.com/)
- [Variables d'environnement Node.js](https://nodejs.org/api/process.html#processenv)

---

*Documentation mise à jour le : $(date)*
