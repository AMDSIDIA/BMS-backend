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

// GET /api/suivi-resultats - Récupérer le suivi des résultats
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération du suivi des résultats...');
    
    // Récupérer toutes les offres avec leurs résultats
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
        COALESCE(r.resultat, 'En cours') as resultat,
        r.date_depot_prevu,
        r.date_depot_effectif,
        r.commentaire as commentaire_resultat,
        r.created_at as date_creation_resultat
      FROM offres o
      LEFT JOIN resultats r ON o.id = r.offre_id
      ORDER BY o.date_depot DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('ℹ️ Aucune offre trouvée pour le suivi des résultats');
      return res.json([]);
    }
    
    console.log(`✅ ${result.rows.length} offres récupérées pour le suivi des résultats`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du suivi des résultats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du suivi des résultats',
      details: error.message 
    });
  }
});

// GET /api/suivi-resultats/pole/:poleName - Récupérer les résultats par pôle
router.get('/pole/:poleName', authenticateToken, async (req, res) => {
  try {
    const { poleName } = req.params;
    console.log(`📊 Récupération des résultats pour le pôle: ${poleName}`);
    
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
        COALESCE(r.resultat, 'En cours') as resultat,
        r.date_depot_prevu,
        r.date_depot_effectif,
        r.commentaire as commentaire_resultat,
        r.created_at as date_creation_resultat
      FROM offres o
      LEFT JOIN resultats r ON o.id = r.offre_id
      WHERE o.pole_lead = $1 OR o.pole_associes LIKE $2
      ORDER BY o.date_depot DESC
    `, [poleName, `%${poleName}%`]);
    
    console.log(`✅ ${result.rows.length} offres trouvées pour le pôle ${poleName}`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des résultats par pôle:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des résultats par pôle',
      details: error.message 
    });
  }
});

// GET /api/suivi-resultats/statistiques - Récupérer les statistiques des résultats
router.get('/statistiques', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques des résultats...');
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_offres,
        COUNT(CASE WHEN r.resultat = 'Gagné' THEN 1 END) as offres_gagnees,
        COUNT(CASE WHEN r.resultat = 'Perdu' THEN 1 END) as offres_perdues,
        COUNT(CASE WHEN r.resultat = 'En cours' OR r.resultat IS NULL THEN 1 END) as offres_en_cours,
        SUM(CASE WHEN r.resultat = 'Gagné' THEN COALESCE(o.montant, 0) ELSE 0 END) as montant_total_gagne,
        SUM(CASE WHEN r.resultat = 'Perdu' THEN COALESCE(o.montant, 0) ELSE 0 END) as montant_total_perdu,
        AVG(CASE WHEN r.resultat = 'Gagné' THEN COALESCE(o.montant, 0) ELSE NULL END) as montant_moyen_gagne,
        AVG(CASE WHEN r.resultat = 'Perdu' THEN COALESCE(o.montant, 0) ELSE NULL END) as montant_moyen_perdu
      FROM offres o
      LEFT JOIN resultats r ON o.id = r.offre_id
    `);
    
    const stats = result.rows[0];
    
    // Calculer les pourcentages
    const totalOffres = parseInt(stats.total_offres) || 0;
    const tauxReussite = totalOffres > 0 ? ((parseInt(stats.offres_gagnees) || 0) / totalOffres * 100).toFixed(1) : 0;
    const tauxEchec = totalOffres > 0 ? ((parseInt(stats.offres_perdues) || 0) / totalOffres * 100).toFixed(1) : 0;
    
    const statistiques = {
      total_offres: totalOffres,
      offres_gagnees: parseInt(stats.offres_gagnees) || 0,
      offres_perdues: parseInt(stats.offres_perdues) || 0,
      offres_en_cours: parseInt(stats.offres_en_cours) || 0,
      taux_reussite: parseFloat(tauxReussite),
      taux_echec: parseFloat(tauxEchec),
      montant_total_gagne: parseFloat(stats.montant_total_gagne) || 0,
      montant_total_perdu: parseFloat(stats.montant_total_perdu) || 0,
      montant_moyen_gagne: parseFloat(stats.montant_moyen_gagne) || 0,
      montant_moyen_perdu: parseFloat(stats.montant_moyen_perdu) || 0
    };
    
    console.log('✅ Statistiques des résultats récupérées');
    res.json(statistiques);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
});

// POST /api/suivi-resultats - Créer un nouveau résultat
router.post('/', authenticateToken, async (req, res) => {
    try {
    const { 
      offre_id, 
      resultat, 
      date_depot_prevu, 
      date_depot_effectif, 
      commentaire 
    } = req.body;
    
    if (!offre_id || !resultat) {
      return res.status(400).json({ 
        error: 'offre_id et resultat sont requis' 
      });
    }
    
    console.log(`📝 Création d'un résultat pour l'offre ${offre_id}`);
    
    // Vérifier si l'offre existe
    const offreCheck = await query('SELECT id FROM offres WHERE id = $1', [offre_id]);
    if (offreCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }
    
    // Vérifier si un résultat existe déjà
    const existingResult = await query(
      'SELECT id FROM resultats WHERE offre_id = $1', 
      [offre_id]
    );
    
    let result;
    if (existingResult.rows.length > 0) {
      // Mettre à jour le résultat existant
      result = await query(`
        UPDATE resultats 
        SET resultat = $1, date_depot_prevu = $2, date_depot_effectif = $3, 
            commentaire = $4, updated_at = CURRENT_TIMESTAMP
        WHERE offre_id = $5
        RETURNING *
      `, [resultat, date_depot_prevu, date_depot_effectif, commentaire, offre_id]);
      
      console.log('✅ Résultat mis à jour');
    } else {
      // Créer un nouveau résultat
      result = await query(`
        INSERT INTO resultats (offre_id, resultat, date_depot_prevu, date_depot_effectif, commentaire)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [offre_id, resultat, date_depot_prevu, date_depot_effectif, commentaire]);
      
      console.log('✅ Nouveau résultat créé');
    }
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du résultat:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du résultat',
      details: error.message 
    });
  }
});

// PUT /api/suivi-resultats/:id - Mettre à jour un résultat
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      resultat, 
      date_depot_prevu, 
      date_depot_effectif, 
      commentaire 
    } = req.body;
    
    console.log(`📝 Mise à jour du résultat ${id}`);
    
    const result = await query(`
      UPDATE resultats 
      SET resultat = $1, date_depot_prevu = $2, date_depot_effectif = $3, 
          commentaire = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [resultat, date_depot_prevu, date_depot_effectif, commentaire, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Résultat non trouvé' });
    }
    
    console.log('✅ Résultat mis à jour');
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du résultat:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du résultat',
      details: error.message 
    });
  }
});

// DELETE /api/suivi-resultats/:id - Supprimer un résultat
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Suppression du résultat ${id}`);
    
    const result = await query(
      'DELETE FROM resultats WHERE id = $1 RETURNING *', 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Résultat non trouvé' });
    }
    
    console.log('✅ Résultat supprimé');
    res.json({ message: 'Résultat supprimé avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du résultat:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du résultat',
      details: error.message 
    });
  }
});

module.exports = router;
