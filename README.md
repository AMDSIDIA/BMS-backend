# 🚀 BMS Backend API

Backend Express.js complet pour le système BMS, optimisé pour le déploiement sur Render avec support CORS pour Vercel.

## ✨ Fonctionnalités

- ✅ **Authentification complète** : Login, Register, Profile, Logout
- ✅ **CORS configuré** pour Vercel et développement local
- ✅ **Validation des données** avec express-validator
- ✅ **Sécurité renforcée** avec Helmet
- ✅ **Logging complet** avec Morgan
- ✅ **Gestion d'erreur** robuste
- ✅ **Prêt pour Render** avec variables d'environnement

## 🏗️ Architecture

```
backend/
├── server.js          # Serveur Express principal
├── routes/
│   └── auth.js       # Routes d'authentification
├── package.json       # Dépendances et scripts
├── .env.example      # Variables d'environnement
└── README.md         # Documentation
```

## 🚀 Déploiement sur Render

### 1. **Préparer le code**
```bash
# Cloner ou télécharger le code
git clone <votre-repo>
cd backend

# Installer les dépendances
npm install
```

### 2. **Configurer Render**
1. Connectez-vous à [Render](https://render.com)
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repository GitHub
4. Configurez le service :
   - **Name** : `bms-backend`
   - **Environment** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free (ou payant selon vos besoins)

### 3. **Variables d'environnement sur Render**
Ajoutez ces variables dans l'onglet **Environment** :
```bash
NODE_ENV=production
FRONTEND_URL=https://ton-frontend.vercel.app
JWT_SECRET=votre-secret-jwt-super-securise-pour-bms
```

### 4. **Déployer**
- Cliquez sur **"Create Web Service"**
- Render va automatiquement déployer votre backend
- L'URL sera : `https://votre-app.onrender.com`

## 🔐 Routes d'authentification

### **POST /api/auth/login**
Connexion utilisateur
```json
// Request
{
  "email": "test@bms.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "message": "Login OK",
  "user": {
    "id": 1,
    "email": "test@bms.com",
    "nom": "Test",
    "prenom": "User",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### **POST /api/auth/register**
Inscription utilisateur
```json
// Request
{
  "email": "nouveau@bms.com",
  "password": "motdepasse123",
  "nom": "Nouveau",
  "prenom": "Utilisateur"
}
```

### **GET /api/auth/profile**
Profil utilisateur (protégé)
```bash
Authorization: Bearer <token>
```

### **POST /api/auth/logout**
Déconnexion

### **GET /api/auth/test**
Test du module d'authentification

## 🌐 Configuration CORS

Le backend accepte les requêtes de :
- `https://ton-frontend.vercel.app` (votre frontend)
- `https://*.vercel.app` (tous les sous-domaines Vercel)
- `https://*.vercel.com` (domaine principal Vercel)
- `http://localhost:3000` (développement local uniquement)

## 🧪 Tests

### **Test local**
```bash
# Démarrer le serveur
npm start

# Tester avec curl
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@bms.com","password":"password123"}'
```

### **Test sur Render**
```bash
curl -X POST https://votre-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@bms.com","password":"password123"}'
```

## 🔧 Développement local

### **Installation**
```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos valeurs
```

### **Démarrage**
```bash
# Production
npm start

# Développement avec auto-reload
npm run dev
```

### **Variables d'environnement locales**
```bash
# .env
PORT=10000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-key
```

## 📊 Endpoints disponibles

- `GET /` - Informations de l'API
- `GET /api/health` - Vérification de l'état du serveur
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/test` - Test du module

## 🚨 Gestion d'erreur

Toutes les erreurs sont formatées de manière cohérente :
```json
{
  "success": false,
  "error": "Type d'erreur",
  "message": "Message d'erreur",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔒 Sécurité

- **Helmet** : Headers de sécurité HTTP
- **CORS** : Restriction des origines autorisées
- **Validation** : Validation des données d'entrée
- **Rate limiting** : À implémenter selon vos besoins
- **JWT** : Prêt pour l'authentification sécurisée

## 📝 Prochaines étapes

1. **Déployer sur Render** avec ce code
2. **Tester la route login** avec votre frontend Vercel
3. **Implémenter la base de données** si nécessaire
4. **Ajouter l'authentification JWT** complète
5. **Étendre les routes** selon vos besoins métier

## 🆘 Support

- **Logs** : Vérifiez les logs sur Render
- **Health check** : `/api/health` pour diagnostiquer
- **CORS** : Vérifiez la console du navigateur
- **Variables d'environnement** : Vérifiez la configuration Render

---

**🎯 Votre backend est maintenant prêt pour le déploiement sur Render !**
