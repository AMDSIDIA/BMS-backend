const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const router = express.Router();

// Validation middleware
const validateOffre = [
  body('intitule_offre').notEmpty().trim().isLength({ min: 3 }),
  body('bailleur').notEmpty().trim(),
  body('pays').isArray(),
  body('date_depot').isISO8601(),
  body('statut').isIn(['brouillon', 'en_attente', 'approuvée', 'rejetée']),
  body('priorite').isIn(['Basse', 'Normale', 'Haute', 'Critique']),
  body('pole_lead').notEmpty().trim()
];

// Middleware d'authentification (simplifié)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }
  // Ici vous pouvez ajouter la vérification JWT
  next();
};

// GET - Récupérer toutes les offres
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { statut, pole_lead, priorite } = req.query;
    
    let queryText = 'SELECT * FROM offres';
    let queryParams = [];
    let conditions = [];
    
    // Filtres
    if (statut) {
      conditions.push(`statut = $${conditions.length + 1}`);
      queryParams.push(statut);
    }
    if (pole_lead) {
      conditions.push(`pole_lead = $${conditions.length + 1}`);
      queryParams.push(pole_lead);
    }
    if (priorite) {
      conditions.push(`priorite = $${conditions.length + 1}`);
      queryParams.push(priorite);
    }
    
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    const result = await query(queryText, queryParams);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
  }
});

// GET - Récupérer une offre par ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM offres WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'offre:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'offre' });
  }
});

// POST - Créer une nouvelle offre
router.post('/', authenticateToken, validateOffre, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      intitule_offre,
      bailleur,
      pays,
      date_depot,
      statut = 'en_attente',
      priorite = 'Normale',
      pole_lead,
      pole_associes,
      commentaire,
      montant,
      type_offre
    } = req.body;

    const result = await query(
      `INSERT INTO offres (
        intitule_offre, bailleur, pays, date_depot, statut, priorite, 
        pole_lead, pole_associes, commentaire, montant, type_offre
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        intitule_offre, bailleur, pays, date_depot, statut, priorite,
        pole_lead, pole_associes, commentaire, montant, type_offre
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Offre créée avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'offre:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'offre' });
  }
});

// PUT - Mettre à jour une offre
router.put('/:id', authenticateToken, validateOffre, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      intitule_offre,
      bailleur,
      pays,
      date_depot,
      statut,
      priorite,
      pole_lead,
      pole_associes,
      commentaire,
      montant,
      type_offre
    } = req.body;

    const result = await query(
      `UPDATE offres SET 
        intitule_offre = $1, bailleur = $2, pays = $3, date_depot = $4, 
        statut = $5, priorite = $6, pole_lead = $7, pole_associes = $8, 
        commentaire = $9, montant = $10, type_offre = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 RETURNING *`,
      [
        intitule_offre, bailleur, pays, date_depot, statut, priorite,
        pole_lead, pole_associes, commentaire, montant, type_offre, req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    res.json({
      success: true,
      message: 'Offre mise à jour avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'offre' });
  }
});

// DELETE - Supprimer une offre
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM offres WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    res.json({
      success: true,
      message: 'Offre supprimée avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'offre' });
  }
});

// PATCH - Valider/Rejeter une offre
router.patch('/:id/validate', authenticateToken, async (req, res) => {
  try {
    const { action, commentaire } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide. Utilisez "approve" ou "reject"' });
    }

    const newStatut = action === 'approve' ? 'approuvée' : 'rejetée';
    
    const result = await query(
      `UPDATE offres SET 
        statut = $1, commentaire = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 RETURNING *`,
      [newStatut, commentaire, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    res.json({
      success: true,
      message: `Offre ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la validation de l\'offre:', error);
    res.status(500).json({ error: 'Erreur lors de la validation de l\'offre' });
  }
});

// GET - Offre du jour
router.get('/jour/du-jour', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await query(
      `SELECT * FROM offres 
       WHERE DATE(created_at) = $1 AND statut = 'approuvée' 
       ORDER BY created_at DESC LIMIT 1`,
      [today]
    );

    let offreDuJour;
    if (result.rows.length > 0) {
      offreDuJour = result.rows[0];
    } else {
      // Fallback sur la dernière offre approuvée
      const fallbackResult = await query(
        `SELECT * FROM offres 
         WHERE statut = 'approuvée' 
         ORDER BY created_at DESC LIMIT 1`
      );
      offreDuJour = fallbackResult.rows[0] || null;
    }

    res.json({
      success: true,
      data: offreDuJour
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'offre du jour:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'offre du jour' });
  }
});

module.exports = router; 