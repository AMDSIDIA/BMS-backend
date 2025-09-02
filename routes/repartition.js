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

// GET /api/repartition - Récupérer toutes les répartitions
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des données de répartition...');
    
    // Récupérer toutes les offres avec leurs répartitions
    const result = await query(`
      SELECT 
        o.id,
        o.intitule_offre,
        o.bailleur,
        o.pole_lead,
        o.pole_associes,
        o.statut,
        o.priorite,
        o.date_depot,
        o.montant,
        o.type_offre,
        o.commentaire,
        r.date_repartition,
        r.created_at as date_repartition_created
      FROM offres o
      LEFT JOIN repartitions r ON o.id = r.offre_id
      ORDER BY o.date_depot DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️ Aucune offre trouvée pour la répartition');
      return res.json([]);
    }
    
    console.log(`✅ ${result.rows.length} offres récupérées pour la répartition`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des répartitions:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des répartitions',
      details: error.message 
    });
  }
});

// GET /api/repartition/pole/:poleName - Récupérer les répartitions par pôle
router.get('/pole/:poleName', authenticateToken, async (req, res) => {
  try {
    const { poleName } = req.params;
    console.log(`📊 Récupération des répartitions pour le pôle: ${poleName}`);
    
    const result = await query(`
      SELECT 
        o.id,
        o.intitule_offre,
        o.bailleur,
        o.pole_lead,
        o.pole_associes,
        o.statut,
        o.priorite,
        o.date_depot,
        o.montant,
        o.type_offre,
        o.commentaire,
        r.date_repartition,
        r.created_at as date_repartition_created
      FROM offres o
      LEFT JOIN repartitions r ON o.id = r.offre_id
      WHERE o.pole_lead = $1 OR o.pole_associes LIKE $2
      ORDER BY o.date_depot DESC
    `, [poleName, `%${poleName}%`]);
    
    console.log(`✅ ${result.rows.length} offres trouvées pour le pôle ${poleName}`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des répartitions par pôle:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des répartitions par pôle',
      details: error.message 
    });
  }
});

// POST /api/repartition - Créer une nouvelle répartition
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { offre_id, pole_lead, pole_associes } = req.body;
    
    if (!offre_id || !pole_lead) {
      return res.status(400).json({ 
        error: 'offre_id et pole_lead sont requis' 
      });
    }
    
    console.log(`📝 Création d'une répartition pour l'offre ${offre_id}`);
    
    // Vérifier si l'offre existe
    const offreCheck = await query('SELECT id FROM offres WHERE id = $1', [offre_id]);
    if (offreCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    // Vérifier si une répartition existe déjà
    const existingRepartition = await query(
      'SELECT id FROM repartitions WHERE offre_id = $1', 
      [offre_id]
    );
    
    let result;
    if (existingRepartition.rows.length > 0) {
      // Mettre à jour la répartition existante
      result = await query(`
        UPDATE repartitions 
        SET pole_lead = $1, pole_associes = $2, date_repartition = CURRENT_DATE
        WHERE offre_id = $3
        RETURNING *
      `, [pole_lead, pole_associes, offre_id]);
      
      console.log('✅ Répartition mise à jour');
    } else {
      // Créer une nouvelle répartition
      result = await query(`
        INSERT INTO repartitions (offre_id, pole_lead, pole_associes)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [offre_id, pole_lead, pole_associes]);
      
      console.log('✅ Nouvelle répartition créée');
    }
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la répartition:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la répartition',
      details: error.message 
    });
  }
});

// PUT /api/repartition/:id - Mettre à jour une répartition
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { pole_lead, pole_associes } = req.body;
    
    console.log(`📝 Mise à jour de la répartition ${id}`);
    
    const result = await query(`
      UPDATE repartitions 
      SET pole_lead = $1, pole_associes = $2, date_repartition = CURRENT_DATE
      WHERE id = $3
      RETURNING *
    `, [pole_lead, pole_associes, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Répartition non trouvée' });
    }
    
    console.log('✅ Répartition mise à jour');
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la répartition:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de la répartition',
      details: error.message 
    });
  }
});

// DELETE /api/repartition/:id - Supprimer une répartition
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Suppression de la répartition ${id}`);
    
    const result = await query(
      'DELETE FROM repartitions WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Répartition non trouvée' });
    }
    
    console.log('✅ Répartition supprimée');
    res.json({ message: 'Répartition supprimée avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la répartition:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de la répartition',
      details: error.message 
    });
  }
});

module.exports = router;
