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

// GET /api/search - Recherche avancée des offres
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      q, // terme de recherche général
      type_offre,
      statut,
      priorite,
      pole_lead,
      bailleur,
      date_debut,
      date_fin,
      montant_min,
      montant_max,
      limit = 50,
      offset = 0
    } = req.query;

    console.log('🔍 Recherche avancée des offres...');
    console.log('📋 Critères:', { q, type_offre, statut, priorite, pole_lead, bailleur, date_debut, date_fin, montant_min, montant_max });

    // Construction de la requête SQL dynamique
    let sqlQuery = `
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
        o.pays,
        o.date_soumission_validation,
        o.date_montage_administratif,
        o.created_at
      FROM offres o
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Recherche textuelle générale
    if (q) {
      sqlQuery += ` AND (
        o.intitule_offre ILIKE $${paramIndex} OR 
        o.bailleur ILIKE $${paramIndex} OR 
        o.commentaire ILIKE $${paramIndex} OR
        o.pole_lead ILIKE $${paramIndex} OR
        o.pole_associes ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${q}%`);
      paramIndex++;
    }

    // Filtres spécifiques
    if (type_offre) {
      sqlQuery += ` AND o.type_offre = $${paramIndex}`;
      queryParams.push(type_offre);
      paramIndex++;
    }

    if (statut) {
      sqlQuery += ` AND o.statut = $${paramIndex}`;
      queryParams.push(statut);
      paramIndex++;
    }

    if (priorite) {
      sqlQuery += ` AND o.priorite = $${paramIndex}`;
      queryParams.push(priorite);
      paramIndex++;
    }

    if (pole_lead) {
      sqlQuery += ` AND o.pole_lead = $${paramIndex}`;
      queryParams.push(pole_lead);
      paramIndex++;
    }

    if (bailleur) {
      sqlQuery += ` AND o.bailleur ILIKE $${paramIndex}`;
      queryParams.push(`%${bailleur}%`);
      paramIndex++;
    }

    // Filtres de dates
    if (date_debut) {
      sqlQuery += ` AND o.date_depot >= $${paramIndex}`;
      queryParams.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      sqlQuery += ` AND o.date_depot <= $${paramIndex}`;
      queryParams.push(date_fin);
      paramIndex++;
    }

    // Filtres de montant
    if (montant_min) {
      sqlQuery += ` AND o.montant >= $${paramIndex}`;
      queryParams.push(parseFloat(montant_min));
      paramIndex++;
    }

    if (montant_max) {
      sqlQuery += ` AND o.montant <= $${paramIndex}`;
      queryParams.push(parseFloat(montant_max));
      paramIndex++;
    }

    // Tri et pagination
    sqlQuery += ` ORDER BY o.date_depot DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    console.log('🔍 Exécution de la requête SQL...');
    const result = await query(sqlQuery, queryParams);

    // Récupérer le nombre total de résultats (sans pagination)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM offres o
      WHERE 1=1
    `;
    
    const countParams = [];
    paramIndex = 1;

    // Appliquer les mêmes filtres pour le comptage
    if (q) {
      countQuery += ` AND (
        o.intitule_offre ILIKE $${paramIndex} OR 
        o.bailleur ILIKE $${paramIndex} OR 
        o.commentaire ILIKE $${paramIndex} OR
        o.pole_lead ILIKE $${paramIndex} OR
        o.pole_associes ILIKE $${paramIndex}
      )`;
      countParams.push(`%${q}%`);
      paramIndex++;
    }

    if (type_offre) {
      countQuery += ` AND o.type_offre = $${paramIndex}`;
      countParams.push(type_offre);
      paramIndex++;
    }

    if (statut) {
      countQuery += ` AND o.statut = $${paramIndex}`;
      countParams.push(statut);
      paramIndex++;
    }

    if (priorite) {
      countQuery += ` AND o.priorite = $${paramIndex}`;
      countParams.push(priorite);
      paramIndex++;
    }

    if (pole_lead) {
      countQuery += ` AND o.pole_lead = $${paramIndex}`;
      countParams.push(pole_lead);
      paramIndex++;
    }

    if (bailleur) {
      countQuery += ` AND o.bailleur ILIKE $${paramIndex}`;
      countParams.push(`%${bailleur}%`);
      paramIndex++;
    }

    if (date_debut) {
      countQuery += ` AND o.date_depot >= $${paramIndex}`;
      countParams.push(date_debut);
      paramIndex++;
    }

    if (date_fin) {
      countQuery += ` AND o.date_depot <= $${paramIndex}`;
      countParams.push(date_fin);
      paramIndex++;
    }

    if (montant_min) {
      countQuery += ` AND o.montant >= $${paramIndex}`;
      countParams.push(parseFloat(montant_min));
      paramIndex++;
    }

    if (montant_max) {
      countQuery += ` AND o.montant <= $${paramIndex}`;
      countParams.push(parseFloat(montant_max));
      paramIndex++;
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // Préparer la réponse
    const response = {
      resultats: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / parseInt(limit)),
        page_courante: Math.floor(parseInt(offset) / parseInt(limit)) + 1
      },
      filtres_appliques: {
        q: q || null,
        type_offre: type_offre || null,
        statut: statut || null,
        priorite: priorite || null,
        pole_lead: pole_lead || null,
        bailleur: bailleur || null,
        date_debut: date_debut || null,
        date_fin: date_fin || null,
        montant_min: montant_min || null,
        montant_max: montant_max || null
      }
    };

    console.log(`✅ Recherche terminée: ${result.rows.length} résultats sur ${totalCount} total`);
    res.json(response);

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche',
      details: error.message 
    });
  }
});

// GET /api/search/suggestions - Suggestions de recherche
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    console.log(`💡 Recherche de suggestions pour: ${q}`);

    const result = await query(`
      SELECT DISTINCT
        'intitule' as type,
        intitule_offre as valeur,
        COUNT(*) as frequence
      FROM offres 
      WHERE intitule_offre ILIKE $1
      GROUP BY intitule_offre
      
      UNION ALL
      
      SELECT DISTINCT
        'bailleur' as type,
        bailleur as valeur,
        COUNT(*) as frequence
      FROM offres 
      WHERE bailleur ILIKE $1
      GROUP BY bailleur
      
      UNION ALL
      
      SELECT DISTINCT
        'pole' as type,
        pole_lead as valeur,
        COUNT(*) as frequence
      FROM offres 
      WHERE pole_lead ILIKE $1
      GROUP BY pole_lead
      
      ORDER BY frequence DESC, valeur
      LIMIT 10
    `, [`%${q}%`]);

    const suggestions = result.rows.map(row => ({
      type: row.type,
      valeur: row.valeur,
      frequence: parseInt(row.frequence)
    }));

    console.log(`✅ ${suggestions.length} suggestions trouvées`);
    res.json({ suggestions });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des suggestions',
      details: error.message 
    });
  }
});

// GET /api/search/statistiques - Statistiques de recherche
router.get('/statistiques', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques de recherche...');

    const result = await query(`
      SELECT 
        COUNT(*) as total_offres,
        COUNT(DISTINCT type_offre) as types_offres_uniques,
        COUNT(DISTINCT statut) as statuts_uniques,
        COUNT(DISTINCT priorite) as priorites_uniques,
        COUNT(DISTINCT pole_lead) as poles_uniques,
        COUNT(DISTINCT bailleur) as bailleurs_uniques,
        MIN(montant) as montant_min,
        MAX(montant) as montant_max,
        AVG(montant) as montant_moyen,
        MIN(date_depot) as date_plus_ancienne,
        MAX(date_depot) as date_plus_recente
      FROM offres
    `);

    const stats = result.rows[0];
    
    // Récupérer les valeurs uniques pour les filtres
    const typesOffres = await query('SELECT DISTINCT type_offre FROM offres ORDER BY type_offre');
    const statuts = await query('SELECT DISTINCT statut FROM offres ORDER BY statut');
    const priorites = await query('SELECT DISTINCT priorite FROM offres ORDER BY priorite');
    const poles = await query('SELECT DISTINCT pole_lead FROM offres WHERE pole_lead IS NOT NULL ORDER BY pole_lead');
    const bailleurs = await query('SELECT DISTINCT bailleur FROM offres ORDER BY bailleur');

    const statistiques = {
      total_offres: parseInt(stats.total_offres) || 0,
      types_offres_uniques: parseInt(stats.types_offres_uniques) || 0,
      statuts_uniques: parseInt(stats.statuts_uniques) || 0,
      priorites_uniques: parseInt(stats.priorites_uniques) || 0,
      poles_uniques: parseInt(stats.poles_uniques) || 0,
      bailleurs_uniques: parseInt(stats.bailleurs_uniques) || 0,
      montant: {
        min: parseFloat(stats.montant_min) || 0,
        max: parseFloat(stats.montant_max) || 0,
        moyen: parseFloat(stats.montant_moyen) || 0
      },
      dates: {
        plus_ancienne: stats.date_plus_ancienne,
        plus_recente: stats.date_plus_recente
      },
      filtres_disponibles: {
        types_offres: typesOffres.rows.map(row => row.type_offre),
        statuts: statuts.rows.map(row => row.statut),
        priorites: priorites.rows.map(row => row.priorite),
        poles: poles.rows.map(row => row.pole_lead),
        bailleurs: bailleurs.rows.map(row => row.bailleur)
      }
    };

    console.log('✅ Statistiques de recherche récupérées');
    res.json(statistiques);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques de recherche:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques de recherche',
      details: error.message 
            });
          }
        });

module.exports = router;
