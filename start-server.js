#!/usr/bin/env node

/**
 * Script pour démarrer le serveur BMS avec debug
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import de la configuration de la base de données
const { initDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Démarrage du serveur BMS...');
console.log(`📊 Port: ${PORT}`);
console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);

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

console.log('✅ Middleware configuré');

// Routes
try {
  console.log('📡 Chargement des routes...');
  app.use('/api/auth', require('./routes/auth'));
  console.log('   ✅ Route auth chargée');
  app.use('/api/offres', require('./routes/offres'));
  console.log('   ✅ Route offres chargée');
  app.use('/api/users', require('./routes/users'));
  console.log('   ✅ Route users chargée');
  app.use('/api/dashboard', require('./routes/dashboard'));
  console.log('   ✅ Route dashboard chargée');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes:', error.message);
  process.exit(1);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BMS Backend API is running',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Health check configuré');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

console.log('✅ Gestion d\'erreurs configurée');

// Initialiser la base de données et démarrer le serveur
const startServer = async () => {
  try {
    console.log('🗄️  Initialisation de la base de données...');
    
    // Essayer d'initialiser la base de données
    try {
      await initDatabase();
      console.log('✅ Base de données initialisée avec succès');
    } catch (dbError) {
      console.warn('⚠️  Erreur de connexion à la base de données:', dbError.message);
      console.warn('   Le serveur continuera sans base de données...');
    }
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log('🎉 Serveur BMS démarré avec succès !');
      console.log(`📊 Port: ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔧 API Auth: http://localhost:${PORT}/api/auth`);
      console.log(`📋 API Offres: http://localhost:${PORT}/api/offres`);
      console.log(`👥 API Users: http://localhost:${PORT}/api/users`);
      console.log(`📊 API Dashboard: http://localhost:${PORT}/api/dashboard`);
    });
    
  } catch (error) {
    console.error('❌ Erreur fatale lors du démarrage:', error);
    process.exit(1);
  }
};

startServer();
