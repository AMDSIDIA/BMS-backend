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

// GET /api/modalites-poles - Récupérer toutes les modalités des pôles
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des modalités des pôles...');
    
    // Récupérer toutes les modalités des pôles
    const result = await query(`
      SELECT 
        mp.id,
        mp.pole,
        mp.modalite,
        mp.commentaire,
        mp.date_modification,
        mp.created_at,
        COUNT(o.id) as nombre_offres_associees
      FROM modalites_poles mp
      LEFT JOIN offres o ON mp.pole = o.pole_lead OR (o.pole_associes IS NOT NULL AND mp.pole = ANY(string_to_array(o.pole_associes, ', ')))
      GROUP BY mp.id, mp.pole, mp.modalite, mp.commentaire, mp.date_modification, mp.created_at
      ORDER BY mp.pole, mp.modalite
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️ Aucune modalité de pôle trouvée');
      return res.json([]);
    }
    
    console.log(`✅ ${result.rows.length} modalités de pôles récupérées`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modalités des pôles:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des modalités des pôles',
      details: error.message 
    });
  }
});

// GET /api/modalites-poles/pole/:poleName - Récupérer les modalités d'un pôle spécifique
router.get('/pole/:poleName', authenticateToken, async (req, res) => {
  try {
    const { poleName } = req.params;
    console.log(`📊 Récupération des modalités pour le pôle: ${poleName}`);
    
    const result = await query(`
      SELECT 
        mp.id,
        mp.pole,
        mp.modalite,
        mp.commentaire,
        mp.date_modification,
        mp.created_at,
        COUNT(o.id) as nombre_offres_associees
      FROM modalites_poles mp
      LEFT JOIN offres o ON mp.pole = o.pole_lead OR (o.pole_associes IS NOT NULL AND mp.pole = ANY(string_to_array(o.pole_associes, ', ')))
      WHERE mp.pole = $1
      GROUP BY mp.id, mp.pole, mp.modalite, mp.commentaire, mp.date_modification, mp.created_at
      ORDER BY mp.modalite
    `, [poleName]);
    
    if (result.rows.length === 0) {
      console.log(`ℹ️ Aucune modalité trouvée pour le pôle ${poleName}`);
      return res.json([]);
    }
    
    console.log(`✅ ${result.rows.length} modalités trouvées pour le pôle ${poleName}`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des modalités par pôle:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des modalités par pôle',
      details: error.message 
    });
  }
});

// GET /api/modalites-poles/statistiques - Récupérer les statistiques des modalités
router.get('/statistiques', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques des modalités des pôles...');
    
    const result = await query(`
      SELECT 
        mp.pole,
        COUNT(mp.id) as nombre_modalites,
        COUNT(DISTINCT o.id) as nombre_offres_associees,
        AVG(CAST(o.montant AS DECIMAL)) as montant_moyen_offres,
        STRING_AGG(DISTINCT mp.modalite, ', ') as modalites_disponibles
      FROM modalites_poles mp
      LEFT JOIN offres o ON mp.pole = o.pole_lead OR (o.pole_associes IS NOT NULL AND mp.pole = ANY(string_to_array(o.pole_associes, ', ')))
      GROUP BY mp.pole
      ORDER BY nombre_offres_associees DESC
    `);
    
    const statistiques = {
      total_poles: result.rows.length,
      poles: result.rows.map(row => ({
        pole_nom: row.pole,
        nombre_modalites: parseInt(row.nombre_modalites) || 0,
        nombre_offres_associees: parseInt(row.nombre_offres_associees) || 0,
        montant_moyen_offres: parseFloat(row.montant_moyen_offres) || 0,
        modalites_disponibles: row.modalites_disponibles || ''
      }))
    };
    
    console.log('✅ Statistiques des modalités des pôles récupérées');
    res.json(statistiques);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
});

// POST /api/modalites-poles - Créer une nouvelle modalité de pôle
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      pole, 
      modalite, 
      commentaire 
    } = req.body;
    
    if (!pole || !modalite) {
      return res.status(400).json({ 
        error: 'pole et modalite sont requis' 
      });
    }
    
    console.log(`📝 Création d'une modalité pour le pôle ${pole}`);
    
    // Vérifier si la modalité existe déjà pour ce pôle
    const existingModalite = await query(
      'SELECT id FROM modalites_poles WHERE pole = $1 AND modalite = $2', 
      [pole, modalite]
    );
    
    if (existingModalite.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Cette modalité existe déjà pour ce pôle' 
      });
    }
    
    // Créer la nouvelle modalité
    const result = await query(`
      INSERT INTO modalites_poles (pole, modalite, commentaire)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [pole, modalite, commentaire]);
    
    console.log('✅ Nouvelle modalité de pôle créée');
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la modalité:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la modalité',
      details: error.message 
    });
  }
});

// PUT /api/modalites-poles/:id - Mettre à jour une modalité de pôle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      pole, 
      modalite, 
      commentaire 
    } = req.body;
    
    console.log(`📝 Mise à jour de la modalité ${id}`);
    
    const result = await query(`
      UPDATE modalites_poles 
      SET pole = $1, modalite = $2, commentaire = $3, date_modification = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [pole, modalite, commentaire, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Modalité non trouvée' });
    }
    
    console.log('✅ Modalité mise à jour');
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la modalité:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de la modalité',
      details: error.message 
    });
  }
});

// DELETE /api/modalites-poles/:id - Supprimer une modalité de pôle
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Suppression de la modalité ${id}`);
    
    const result = await query(
      'DELETE FROM modalites_poles WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Modalité non trouvée' });
    }
    
    console.log('✅ Modalité supprimée');
    res.json({ message: 'Modalité supprimée avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la modalité:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de la modalité',
      details: error.message 
    });
  }
});

module.exports = router;
