# 🔧 Correction du Backend BMS - Authentification et CORS

## ✅ Problèmes résolus

1. **Route `/api/auth/login` non trouvée** → Corrigé
2. **Erreur CORS sur Vercel** → Corrigé  
3. **Port incorrect** → Corrigé (10000 local, process.env.PORT sur Render)
4. **Gestion d'erreur améliorée** → Ajoutée

## 🚀 Routes disponibles

### Authentification (`/api/auth`)
- `GET /api/auth/test` - Test du module auth
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/register` - Inscription utilisateur  
- `GET /api/auth/verify` - Vérification du token JWT

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/test` - Test du module dashboard
- `GET /api/dashboard/complete` - Données complètes du dashboard

### Santé (`/api/health`)
- `GET /api/health` - Vérification de l'état du serveur

## 🔐 Test de la route login

### Utilisateur de test
```json
{
  "email": "test@bms.com",
  "password": "password123"
}
```

### Test avec curl
```bash
# Local
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@bms.com","password":"password123"}'

# Sur Render
curl -X POST https://votre-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@bms.com","password":"password123"}'
```

### Réponse attendue
```json
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
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🌐 Configuration CORS

Le backend accepte maintenant les requêtes de :
- `http://localhost:3000` (développement local)
- `https://*.vercel.app` (Vercel)
- `https://*.vercel.com` (Vercel)
- URLs ngrok pour les tests
- URL personnalisée via `VERCEL_FRONTEND_URL`

## ⚙️ Variables d'environnement

```bash
# Port du serveur
PORT=10000                    # Local
PORT=process.env.PORT         # Render (automatique)

# CORS
FRONTEND_URL=http://localhost:3000
VERCEL_FRONTEND_URL=https://votre-app.vercel.app

# JWT
JWT_SECRET=votre-secret-jwt-super-securise-pour-bms
```

## 🧪 Tests

### Script PowerShell
```powershell
.\start-and-test-backend.ps1
```

### Script Node.js
```bash
cd backend
node test-auth.js
```

### Tests manuels
1. **Health check**: `GET /api/health`
2. **Auth test**: `GET /api/auth/test`
3. **Login test**: `POST /api/auth/login`
4. **Dashboard test**: `GET /api/dashboard/test`

## 🚀 Démarrage

### Local
```bash
cd backend
npm install
npm start
# ou
node server.js
```

### Sur Render
Le serveur démarre automatiquement avec `process.env.PORT`

## 🔍 Debugging

### Logs du serveur
- Toutes les requêtes sont loggées
- Erreurs détaillées avec stack trace
- Routes 404 avec méthode et chemin

### Health check étendu
```json
{
  "status": "OK",
  "message": "BMS Backend API is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "cors": ["http://localhost:3000", "https://*.vercel.app"],
  "port": 10000
}
```

## 📝 Notes importantes

1. **Mode fallback** : Si la base de données n'est pas disponible, le serveur utilise un utilisateur de test
2. **Validation** : Toutes les routes valident les données d'entrée
3. **Sécurité** : JWT avec expiration 24h, validation des tokens
4. **Compatibilité** : Fonctionne avec ou sans base de données

## 🐛 Dépannage

### "Route not found"
- Vérifier que le serveur est démarré
- Vérifier l'URL (doit commencer par `/api/`)
- Vérifier les logs du serveur

### Erreur CORS
- Vérifier l'URL du frontend dans les variables d'environnement
- Vérifier que le frontend envoie les bonnes headers
- Vérifier les logs CORS du serveur

### Erreur de serveur
- Vérifier les logs du serveur
- Vérifier la connexion à la base de données
- Vérifier les variables d'environnement

## 🎯 Prochaines étapes

1. **Configurer l'URL de votre frontend Vercel** dans `VERCEL_FRONTEND_URL`
2. **Tester la route login** avec votre frontend
3. **Configurer la base de données** si nécessaire
4. **Personnaliser la logique d'authentification** selon vos besoins
