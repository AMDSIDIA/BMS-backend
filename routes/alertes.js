const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};
const { query } = require('../config/database');

// GET /api/alertes - Récupérer toutes les alertes
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des alertes...');
    
    // Récupérer toutes les alertes avec leurs paramètres
    const result = await query(`
      SELECT 
        a.id,
        a.type_alerte,
        a.message,
        a.date_alerte,
        a.lu,
        a.offre_id,
        o.intitule_offre,
        o.bailleur,
        o.statut as statut_offre
      FROM alertes a
      LEFT JOIN offres o ON a.offre_id = o.id
      ORDER BY a.date_alerte DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️ Aucune alerte trouvée');
      return res.json([]);
    }
    
    console.log(`✅ ${result.rows.length} alertes récupérées`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des alertes',
      details: error.message 
    });
  }
});

// GET /api/alertes/actives - Récupérer les alertes actives
router.get('/actives', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des alertes actives...');
    
    const result = await query(`
      SELECT 
        a.id,
        a.type_alerte,
        a.message,
        a.date_alerte,
        a.lu,
        a.offre_id,
        o.intitule_offre,
        o.bailleur,
        o.statut as statut_offre
      FROM alertes a
      LEFT JOIN offres o ON a.offre_id = o.id
      WHERE a.lu = FALSE
      ORDER BY a.date_alerte DESC
    `);
    
    console.log(`✅ ${result.rows.length} alertes actives récupérées`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes actives:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des alertes actives',
      details: error.message 
    });
  }
});

// GET /api/alertes/utilisateur/:userId - Récupérer les alertes d'un utilisateur
router.get('/utilisateur/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📊 Récupération des alertes pour l'utilisateur ${userId}`);
    
    const result = await query(`
      SELECT 
        a.id,
        a.type_alerte,
        a.titre,
        a.description,
        a.niveau_urgence,
        a.statut,
        a.date_creation,
        a.date_resolution,
        a.utilisateur_id,
        a.offre_id,
        a.pole_concerné,
        a.parametres,
        o.intitule_offre,
        o.bailleur,
        o.statut as statut_offre
      FROM alertes a
      LEFT JOIN offres o ON a.offre_id = o.id
      WHERE a.utilisateur_id = $1
      ORDER BY a.date_creation DESC
    `, [userId]);
    
    console.log(`✅ ${result.rows.length} alertes trouvées pour l'utilisateur ${userId}`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes par utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des alertes par utilisateur',
      details: error.message 
    });
  }
});

// GET /api/alertes/statistiques - Récupérer les statistiques des alertes
router.get('/statistiques', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques des alertes...');
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_alertes,
        COUNT(CASE WHEN lu = FALSE THEN 1 END) as alertes_actives,
        COUNT(CASE WHEN lu = TRUE THEN 1 END) as alertes_resolues,
        COUNT(CASE WHEN type_alerte = 'validation_requise' THEN 1 END) as alertes_validation,
        COUNT(CASE WHEN type_alerte = 'echeance' THEN 1 END) as alertes_echeance,
        COUNT(CASE WHEN type_alerte = 'budget' THEN 1 END) as alertes_budget,
        COUNT(CASE WHEN type_alerte = 'statut' THEN 1 END) as alertes_statut,
        COUNT(CASE WHEN type_alerte = 'repartition' THEN 1 END) as alertes_repartition
      FROM alertes
    `);
    
    const stats = result.rows[0];
    
    const statistiques = {
      total_alertes: parseInt(stats.total_alertes) || 0,
      alertes_actives: parseInt(stats.alertes_actives) || 0,
      alertes_resolues: parseInt(stats.alertes_resolues) || 0,
      par_type: {
        validation: parseInt(stats.alertes_validation) || 0,
        echeance: parseInt(stats.alertes_echeance) || 0,
        budget: parseInt(stats.alertes_budget) || 0,
        statut: parseInt(stats.alertes_statut) || 0,
        repartition: parseInt(stats.alertes_repartition) || 0
      }
    };
    
    console.log('✅ Statistiques des alertes récupérées');
    res.json(statistiques);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
});

// POST /api/alertes - Créer une nouvelle alerte
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      type_alerte, 
      message, 
      offre_id
    } = req.body;
    
    if (!type_alerte || !message) {
      return res.status(400).json({ 
        error: 'type_alerte et message sont requis' 
      });
    }
    
    console.log(`📝 Création d'une alerte: ${type_alerte}`);
    
    // Créer la nouvelle alerte
    const result = await query(`
      INSERT INTO alertes (type_alerte, message, offre_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [type_alerte, message, offre_id]);
    
    console.log('✅ Nouvelle alerte créée');
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'alerte',
      details: error.message 
    });
  }
});

// PUT /api/alertes/:id - Mettre à jour une alerte
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      type_alerte, 
      message, 
      lu
    } = req.body;
    
    console.log(`📝 Mise à jour de l'alerte ${id}`);
    
    const result = await query(`
      UPDATE alertes 
      SET type_alerte = $1, message = $2, lu = $3
      WHERE id = $4
      RETURNING *
    `, [type_alerte, message, lu, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerte non trouvée' });
    }
    
    console.log('✅ Alerte mise à jour');
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de l\'alerte',
      details: error.message 
    });
  }
});

// PUT /api/alertes/:id/resoudre - Marquer une alerte comme résolue
router.put('/:id/resoudre', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`✅ Résolution de l'alerte ${id}`);
    
    const result = await query(`
      UPDATE alertes 
      SET lu = TRUE
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerte non trouvée' });
    }
    
    console.log('✅ Alerte marquée comme résolue');
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la résolution de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la résolution de l\'alerte',
      details: error.message 
    });
  }
});

// DELETE /api/alertes/:id - Supprimer une alerte
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Suppression de l'alerte ${id}`);
    
    const result = await query(
      'DELETE FROM alertes WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alerte non trouvée' });
    }
    
    console.log('✅ Alerte supprimée');
    res.json({ message: 'Alerte supprimée avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'alerte:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de l\'alerte',
      details: error.message 
    });
  }
});

module.exports = router;
