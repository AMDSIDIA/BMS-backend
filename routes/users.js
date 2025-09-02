const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware d'authentification (simplifié)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }
  next();
};

// Données temporaires (à remplacer par une base de données)
let users = [
  {
    id: 1,
    email: 'admin@bms.com',
    nom: 'Admin',
    prenom: 'BMS',
    role: 'admin',
    dateCreation: new Date('2024-01-01'),
    statut: 'actif'
  },
  {
    id: 2,
    email: 'marie.dubois@bms.com',
    nom: 'Dubois',
    prenom: 'Marie',
    role: 'user',
    dateCreation: new Date('2024-01-05'),
    statut: 'actif'
  },
  {
    id: 3,
    email: 'jean.martin@bms.com',
    nom: 'Martin',
    prenom: 'Jean',
    role: 'user',
    dateCreation: new Date('2024-01-10'),
    statut: 'actif'
  },
  {
    id: 4,
    email: 'sophie.laurent@bms.com',
    nom: 'Laurent',
    prenom: 'Sophie',
    role: 'user',
    dateCreation: new Date('2024-01-15'),
    statut: 'actif'
  }
];

// Validation middleware
const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('nom').notEmpty().trim(),
  body('prenom').notEmpty().trim(),
  body('role').isIn(['admin', 'user', 'manager', 'charge_partenariat']),
  body('statut').isIn(['actif', 'inactif', 'suspendu'])
];

// GET - Récupérer tous les utilisateurs
router.get('/', authenticateToken, (req, res) => {
  try {
    const { role, statut } = req.query;
    let filteredUsers = [...users];

    // Filtres
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    if (statut) {
      filteredUsers = filteredUsers.filter(user => user.statut === statut);
    }

    res.json({
      success: true,
      data: filteredUsers,
      total: filteredUsers.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// GET - Récupérer un utilisateur par ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// POST - Créer un nouvel utilisateur
router.post('/', authenticateToken, validateUser, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, nom, prenom, role, statut } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }

    const newUser = {
      id: users.length + 1,
      email,
      nom,
      prenom,
      role: role || 'user',
      statut: statut || 'actif',
      dateCreation: new Date()
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
  }
});

// PUT - Mettre à jour un utilisateur
router.put('/:id', authenticateToken, validateUser, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    users[userIndex] = {
      ...users[userIndex],
      ...req.body,
      id: parseInt(req.params.id) // Garder l'ID original
    };

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: users[userIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
  }
});

// DELETE - Supprimer un utilisateur
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
      data: deletedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

// PATCH - Changer le statut d'un utilisateur
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const { statut } = req.body;
    
    if (!['actif', 'inactif', 'suspendu'].includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    users[userIndex].statut = statut;

    res.json({
      success: true,
      message: `Statut de l'utilisateur changé à ${statut}`,
      data: users[userIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// GET - Statistiques des utilisateurs
router.get('/stats/overview', authenticateToken, (req, res) => {
  try {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.statut === 'actif').length;
    const inactiveUsers = users.filter(u => u.statut === 'inactif').length;
    const suspendedUsers = users.filter(u => u.statut === 'suspendu').length;

    const roleStats = {};
    users.forEach(user => {
      if (!roleStats[user.role]) {
        roleStats[user.role] = 0;
      }
      roleStats[user.role]++;
    });

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      roleStats,
      tauxActivation: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques utilisateurs' });
  }
});

module.exports = router; 