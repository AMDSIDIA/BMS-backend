const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration CORS spécifique pour Vercel
const corsOptions = {
  origin: [
    "https://ton-frontend.vercel.app", // Votre frontend Vercel
    "https://*.vercel.app", // Tous les sous-domaines Vercel
    "https://*.vercel.com", // Domaine principal Vercel
    process.env.FRONTEND_URL, // Variable d'environnement pour flexibilité
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null // Local en dev uniquement
  ].filter(Boolean), // Supprime les valeurs null/undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // Cache CORS pendant 24h
};

// Middleware de sécurité et logging
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging des requêtes
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes API
app.use('/api/auth', require('./routes/auth'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'BMS Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    cors: {
      origins: corsOptions.origin,
      methods: corsOptions.methods
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BMS Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      docs: '/api/docs'
    },
    timestamp: new Date().toISOString()
  });
});

// Middleware de gestion d'erreur
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Ne pas exposer les détails d'erreur en production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// 404 handler pour les routes non trouvées
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login'
    ],
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
const startServer = async () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 BMS Backend Server Started Successfully!');
      console.log('=' .repeat(50));
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Port: ${PORT}`);
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
      console.log(`🔒 CORS Origins: ${corsOptions.origin.join(', ')}`);
      console.log('=' .repeat(50));
      
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Server is running in PRODUCTION mode');
        console.log('🔒 CORS restricted to Vercel domains only');
      } else {
        console.log('🔧 Server is running in DEVELOPMENT mode');
        console.log('🌐 CORS allows localhost for development');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Démarrer le serveur
startServer(); 