const express = require('express');
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Importer les routes dashboard
const dashboardRoutes = require('./routes/dashboard');

// Monter les routes dashboard avec le préfixe /api/dashboard
app.use('/api/dashboard', dashboardRoutes);

// Route de test simple
app.get('/test', (req, res) => {
  res.json({ message: 'Serveur de test fonctionne' });
});

// Démarrer le serveur de test
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Serveur de test démarré sur le port ${PORT}`);
  console.log(`📊 Test dashboard: http://localhost:${PORT}/api/dashboard/complete`);
  console.log(`🧪 Test simple: http://localhost:${PORT}/test`);
  console.log(`📋 Test sans auth: http://localhost:${PORT}/api/dashboard/test`);
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: err.message });
});
