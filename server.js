const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import de la configuration de la base de données
const { initDatabase } = require('./config/database');

// Import du scheduler de recherche automatique
const { startScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /^https:\/\/.*\.ngrok\.io$/,
    /^https:\/\/.*\.ngrok-free\.app$/,
    /^https:\/\/.*\.ngrok\.app$/
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/offres', require('./routes/offres'));
app.use('/api/users', require('./routes/users'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/repartition', require('./routes/repartition'));
app.use('/api/suivi-resultats', require('./routes/suivi-resultats'));
app.use('/api/modalites-poles', require('./routes/modalites-poles'));
app.use('/api/alertes', require('./routes/alertes'));
app.use('/api/search', require('./routes/search'));
app.use('/api/scheduled-searches', require('./routes/scheduled-searches'));
app.use('/api/fichiers-tdr', require('./routes/fichiers-tdr'));
app.use('/api/auto-search', require('./routes/auto-search'));


// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BMS Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialiser la base de données et démarrer le serveur
const startServer = async () => {
  try {
    // Essayer d'initialiser la base de données (optionnel pour les tests)
    try {
      await initDatabase();
      console.log('✅ Database initialized successfully');
    } catch (dbError) {
      console.warn('⚠️  Database connection failed, starting server without database...');

    }
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 BMS Backend server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      
      // Démarrer le scheduler de recherche automatique
      try {
        startScheduler();
        console.log('🔍 Scheduler de recherche automatique démarré');
      } catch (error) {
        console.warn('⚠️  Erreur lors du démarrage du scheduler:', error.message);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 