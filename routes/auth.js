const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Validation middleware pour le login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Le mot de passe est requis')
];

// Validation middleware pour l'inscription
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('nom')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Le nom est requis'),
  body('prenom')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Le prénom est requis')
];

// Route POST /login - Connexion utilisateur
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Log de la tentative de connexion
    console.log(`🔐 Login attempt for: ${email}`);

    // Simulation d'authentification (remplacez par votre logique de base de données)
    // Pour les tests, accepte un utilisateur spécifique
    if (email === 'test@bms.com' && password === 'password123') {
      const user = {
        id: 1,
        email: 'test@bms.com',
        nom: 'Test',
        prenom: 'User',
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      console.log(`✅ Login successful for: ${email}`);

      return res.json({
        success: true,
        message: "Login OK",
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role
        },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.token',
        expiresIn: '24h',
        timestamp: new Date().toISOString()
      });
    }

    // Si les credentials sont incorrects
    console.log(`❌ Login failed for: ${email} - Invalid credentials`);
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Email ou mot de passe incorrect',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erreur lors de la connexion',
      timestamp: new Date().toISOString()
    });
  }
});

// Route POST /register - Inscription utilisateur
router.post('/register', validateRegister, async (req, res) => {
  try {
    // Validation des données
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, nom, prenom } = req.body;

    console.log(`👤 Registration attempt for: ${email}`);

    // Simulation de création d'utilisateur (remplacez par votre logique de base de données)
    // Vérifier si l'utilisateur existe déjà
    if (email === 'test@bms.com') {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'Un utilisateur avec cet email existe déjà',
        timestamp: new Date().toISOString()
      });
    }

    // Créer le nouvel utilisateur
    const newUser = {
      id: Date.now(),
      email,
      nom,
      prenom,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    console.log(`✅ Registration successful for: ${email}`);

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.id,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        role: newUser.role
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erreur lors de l\'inscription',
      timestamp: new Date().toISOString()
    });
  }
});

// Route GET /profile - Profil utilisateur (protégé)
router.get('/profile', async (req, res) => {
  try {
    // Simulation d'authentification par token (remplacez par votre logique JWT)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token d\'authentification requis',
        timestamp: new Date().toISOString()
      });
    }

    // Simuler un utilisateur authentifié
    const user = {
      id: 1,
      email: 'test@bms.com',
      nom: 'Test',
      prenom: 'User',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      message: 'Profil récupéré avec succès',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        createdAt: user.createdAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Profile error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erreur lors de la récupération du profil',
      timestamp: new Date().toISOString()
    });
  }
});

// Route GET /logout - Déconnexion
router.post('/logout', async (req, res) => {
  try {
    console.log('🔓 Logout request received');
    
    // En production, vous pourriez invalider le token JWT ici
    
    return res.json({
      success: true,
      message: 'Déconnexion réussie',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erreur lors de la déconnexion',
      timestamp: new Date().toISOString()
    });
  }
});

// Route GET /test - Test du module auth
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Module d\'authentification fonctionne correctement',
    version: '1.0.0',
    routes: [
      'POST /login - Connexion utilisateur',
      'POST /register - Inscription utilisateur',
      'GET /profile - Profil utilisateur (protégé)',
      'POST /logout - Déconnexion',
      'GET /test - Test du module'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 