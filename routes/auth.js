const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nom').notEmpty().trim(),
  body('prenom').notEmpty().trim()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Route d'inscription
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nom, prenom } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUserResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer le nouvel utilisateur dans la base de données
    const newUserResult = await query(
      'INSERT INTO users (email, password_hash, nom, prenom, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, hashedPassword, nom, prenom, 'user']
    );

    const newUser = newUserResult.rows[0];

    // Générer le token JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Retourner la réponse (sans le mot de passe)
    const { password_hash: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Route de connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Trouver l'utilisateur dans la base de données
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = userResult.rows[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Retourner la réponse (sans le mot de passe)
    const { password_hash: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Connexion réussie',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Route de vérification du token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userResult = await query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userResult.rows[0];
    const { password_hash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
});

module.exports = router; 