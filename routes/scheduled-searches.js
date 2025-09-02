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
    console.log('🔐 Token décodé:', user);
    req.user = user;
    next();
  });
};

const { query } = require('../config/database');

// GET /api/scheduled-searches - Récupérer les recherches programmées d'un utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }

    console.log(`📅 Récupération des recherches programmées pour l'utilisateur ${userId}`);

    const result = await query(`
      SELECT 
        ss.id,
        ss.nom_recherche as keywords,
        ss.criteres_recherche,
        ss.frequence as frequency,
        ss.prochaine_execution as next_run,
        ss.actif as is_active,
        ss.created_at,
        ss.updated_at,
        ss.custom_schedule,
        u.email as utilisateur_email,
        u.nom as utilisateur_nom,
        u.prenom as utilisateur_prenom
      FROM scheduled_searches ss
      LEFT JOIN users u ON ss.utilisateur_id = u.id
      WHERE ss.utilisateur_id = $1
      ORDER BY ss.prochaine_execution ASC
    `, [userId]);

    if (result.rows.length === 0) {
      console.log(`ℹ️ Aucune recherche programmée trouvée pour l'utilisateur ${userId}`);
      return res.json({
        success: true,
        searches: []
      });
    }

    // Transformer les données pour correspondre au format attendu par le frontend
    const searches = result.rows.map(row => ({
      id: row.id,
      keywords: row.keywords,
      frequency: row.frequency,
      next_run: row.next_run,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      custom_schedule: row.custom_schedule,
      last_run: null // À implémenter plus tard
    }));

    console.log(`✅ ${searches.length} recherches programmées récupérées`);
    res.json({
      success: true,
      searches: searches
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des recherches programmées:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des recherches programmées',
      details: error.message 
    });
  }
});

// GET /api/scheduled-searches/statistiques - Statistiques des recherches programmées
router.get('/statistiques', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    console.log(`📊 Récupération des statistiques des recherches programmées pour l'utilisateur ${userId}`);

    const result = await query(`
      SELECT 
        COUNT(*) as total_recherches,
        COUNT(CASE WHEN actif = true THEN 1 END) as recherches_actives,
        COUNT(CASE WHEN actif = false THEN 1 END) as recherches_inactives,
        COUNT(CASE WHEN frequence = 'quotidien' THEN 1 END) as frequence_quotidienne,
        COUNT(CASE WHEN frequence = 'hebdomadaire' THEN 1 END) as frequence_hebdomadaire,
        COUNT(CASE WHEN frequence = 'mensuel' THEN 1 END) as frequence_mensuelle,
        MIN(created_at) as premiere_recherche,
        MAX(created_at) as derniere_recherche
      FROM scheduled_searches
      WHERE utilisateur_id = $1
    `, [userId]);

    const stats = result.rows[0];

    const statistiques = {
      total_recherches: parseInt(stats.total_recherches) || 0,
      recherches_actives: parseInt(stats.recherches_actives) || 0,
      recherches_inactives: parseInt(stats.recherches_inactives) || 0,
      par_frequence: {
        quotidien: parseInt(stats.frequence_quotidienne) || 0,
        hebdomadaire: parseInt(stats.frequence_hebdomadaire) || 0,
        mensuel: parseInt(stats.frequence_mensuelle) || 0
      },
      dates: {
        premiere_recherche: stats.premiere_recherche,
        derniere_recherche: stats.derniere_recherche
      }
    };

    console.log('✅ Statistiques des recherches programmées récupérées');
    res.json(statistiques);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
});

// GET /api/scheduled-searches/:id - Récupérer une recherche programmée spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    console.log(`📅 Récupération de la recherche programmée ${id} pour l'utilisateur ${userId}`);

    const result = await query(`
      SELECT 
        ss.id,
        ss.nom_recherche,
        ss.criteres_recherche,
        ss.frequence,
        ss.prochaine_execution,
        ss.actif,
        ss.created_at,
        ss.updated_at,
        u.email as utilisateur_email,
        u.nom as utilisateur_nom,
        u.prenom as utilisateur_prenom
      FROM scheduled_searches ss
      LEFT JOIN users u ON ss.utilisateur_id = u.id
      WHERE ss.id = $1 AND ss.utilisateur_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recherche programmée non trouvée' });
    }

    console.log('✅ Recherche programmée récupérée');
    res.json(result.rows[0]);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la recherche programmée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération de la recherche programmée',
      details: error.message 
    });
  }
});

// POST /api/scheduled-searches - Créer une nouvelle recherche programmée
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      keywords, 
      frequency, 
      customSchedule,
      period = 'all'
    } = req.body;

    if (!keywords || !keywords.trim()) {
      return res.status(400).json({ 
        error: 'keywords est requis' 
      });
    }

    if (!frequency) {
      return res.status(400).json({ 
        error: 'frequency est requis' 
      });
    }

    console.log(`📅 Création d'une recherche programmée pour l'utilisateur ${userId}`);

    // Calculer la prochaine exécution basée sur la fréquence
    let prochaine_execution = new Date();
    switch (frequency) {
      case 'hourly':
        prochaine_execution.setHours(prochaine_execution.getHours() + 1);
        break;
      case 'daily':
        prochaine_execution.setDate(prochaine_execution.getDate() + 1);
        break;
      case 'weekly':
        prochaine_execution.setDate(prochaine_execution.getDate() + 7);
        break;
      case 'monthly':
        prochaine_execution.setMonth(prochaine_execution.getMonth() + 1);
        break;
      default:
        prochaine_execution.setDate(prochaine_execution.getDate() + 1);
    }

    const result = await query(`
      INSERT INTO scheduled_searches (
        utilisateur_id, 
        nom_recherche, 
        criteres_recherche, 
        frequence, 
        prochaine_execution, 
        actif,
        custom_schedule
      )
      VALUES ($1, $2, $3, $4, $5, true, $6)
      RETURNING *
    `, [
      userId, 
      keywords.trim(), 
      keywords.trim(), 
      frequency, 
      prochaine_execution, 
      customSchedule ? JSON.stringify(customSchedule) : null
    ]);

    console.log('✅ Nouvelle recherche programmée créée');
    res.status(201).json({
      success: true,
      search: result.rows[0],
      message: 'Recherche programmée créée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création de la recherche programmée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de la recherche programmée',
      details: error.message 
    });
  }
});

// PUT /api/scheduled-searches/:id - Mettre à jour une recherche programmée
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { 
      nom_recherche, 
      criteres_recherche, 
      frequence, 
      prochaine_execution, 
      actif 
    } = req.body;

    console.log(`📅 Mise à jour de la recherche programmée ${id}`);

    const result = await query(`
      UPDATE scheduled_searches 
      SET nom_recherche = $1, criteres_recherche = $2, frequence = $3, 
          prochaine_execution = $4, actif = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND utilisateur_id = $7
      RETURNING *
    `, [nom_recherche, criteres_recherche, frequence, prochaine_execution, actif, id, req.user.userId || req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recherche programmée non trouvée' });
    }

    console.log('✅ Recherche programmée mise à jour');
    res.json(result.rows[0]);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la recherche programmée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour de la recherche programmée',
      details: error.message 
    });
  }
});

// DELETE /api/scheduled-searches/:id - Supprimer une recherche programmée
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`🗑️ Suppression de la recherche programmée ${id}`);

    const result = await query(
      'DELETE FROM scheduled_searches WHERE id = $1 AND utilisateur_id = $2 RETURNING *', 
      [id, req.user.userId || req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recherche programmée non trouvée' });
    }

    console.log('✅ Recherche programmée supprimée');
    res.json({ message: 'Recherche programmée supprimée avec succès' });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la recherche programmée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression de la recherche programmée',
      details: error.message 
    });
  }
});

// POST /api/scheduled-searches/:id/executer - Exécuter une recherche programmée manuellement
router.post('/:id/executer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log(`▶️ Exécution manuelle de la recherche programmée ${id}`);

    // Récupérer la recherche programmée
    const searchResult = await query(`
      SELECT * FROM scheduled_searches 
      WHERE id = $1 AND utilisateur_id = $2
    `, [id, req.user.userId || req.user.id]);

    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recherche programmée non trouvée' });
    }

    const scheduledSearch = searchResult.rows[0];

    // Exécuter la recherche avec les critères
    const searchQuery = `
      SELECT 
        o.id,
        o.intitule_offre,
        o.bailleur,
        o.pole_lead,
        o.statut,
        o.priorite,
        o.date_depot,
        o.montant,
        o.type_offre
      FROM offres o
      WHERE 1=1
      ${scheduledSearch.criteres_recherche}
      ORDER BY o.date_depot DESC
      LIMIT 100
    `;

    const searchResults = await query(searchQuery);
    
    // Mettre à jour la prochaine exécution
    await query(`
      UPDATE scheduled_searches 
      SET prochaine_execution = CASE 
        WHEN frequence = 'quotidien' THEN prochaine_execution + INTERVAL '1 day'
        WHEN frequence = 'hebdomadaire' THEN prochaine_execution + INTERVAL '1 week'
        WHEN frequence = 'mensuel' THEN prochaine_execution + INTERVAL '1 month'
        ELSE prochaine_execution + INTERVAL '1 day'
      END
      WHERE id = $1
    `, [id]);

    console.log(`✅ Recherche programmée exécutée: ${searchResults.rows.length} résultats`);
    res.json({
      message: 'Recherche programmée exécutée avec succès',
      resultats: searchResults.rows,
      nombre_resultats: searchResults.rows.length,
      prochaine_execution: scheduledSearch.prochaine_execution
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la recherche programmée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'exécution de la recherche programmée',
      details: error.message 
    });
  }
});

module.exports = router;
