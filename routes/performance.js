const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }
  next();
};

// GET - Vue d'ensemble des performances
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération du suivi de performance - Vue d\'ensemble');
    
    // Récupérer les paramètres de date
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    let dateParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE created_at >= $1 AND created_at <= $2';
      dateParams = [startDate, endDate];
      console.log(`📅 Filtre de période: ${startDate} à ${endDate}`);
    }
    
    // Récupérer les métriques clés
    const [stats, typesOffre] = await Promise.all([
      // Statistiques globales
      query(`
        SELECT 
          COUNT(*) as total_offres,
          COUNT(CASE WHEN statut = 'approuvée' THEN 1 END) as offres_approuvees,
          COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as offres_en_attente,
          COUNT(CASE WHEN statut = 'rejetée' THEN 1 END) as offres_rejetees,
          COUNT(CASE WHEN priorite = 'haute' THEN 1 END) as offres_prioritaires
        FROM offres
        ${dateFilter}
      `, dateParams),
      
      // Statistiques par type d'offre
      query(`
        SELECT 
          CASE 
            WHEN LOWER(type_offre) = 'ao' OR LOWER(type_offre) = 'appel d''offres' THEN 'AO'
            WHEN LOWER(type_offre) = 'ami' OR LOWER(type_offre) = 'appel a manifestation d''interet' THEN 'AMI'
            WHEN LOWER(type_offre) = 'avis general' OR LOWER(type_offre) = 'avis general' THEN 'Avis Général'
            WHEN LOWER(type_offre) = 'appel a projet' OR LOWER(type_offre) = 'appel a projet' THEN 'Appel à projet'
            WHEN LOWER(type_offre) = 'accord cadre' OR LOWER(type_offre) = 'accord-cadre' THEN 'Accord cadre'
            ELSE COALESCE(type_offre, 'Non spécifié')
          END as nom,
          COUNT(*) as total,
          COUNT(CASE WHEN statut = 'approuvée' THEN 1 END) as gagnees,
          COUNT(CASE WHEN statut = 'rejetée' THEN 1 END) as perdues,
          CAST(
            (CAST(COUNT(CASE WHEN statut = 'approuvée' THEN 1 END) AS FLOAT) / COUNT(*)) * 100 AS DECIMAL(5,1)
          ) as taux_gagnees,
          CAST(
            (CAST(COUNT(CASE WHEN statut = 'rejetée' THEN 1 END) AS FLOAT) / COUNT(*)) * 100 AS DECIMAL(5,1)
          ) as taux_perdues
        FROM offres
        ${dateFilter}
        GROUP BY 
          CASE 
            WHEN LOWER(type_offre) = 'ao' OR LOWER(type_offre) = 'appel d''offres' THEN 'AO'
            WHEN LOWER(type_offre) = 'ami' OR LOWER(type_offre) = 'appel a manifestation d''interet' THEN 'AMI'
            WHEN LOWER(type_offre) = 'avis general' OR LOWER(type_offre) = 'avis general' THEN 'Avis Général'
            WHEN LOWER(type_offre) = 'appel a projet' OR LOWER(type_offre) = 'appel a projet' THEN 'Appel à projet'
            WHEN LOWER(type_offre) = 'accord cadre' OR LOWER(type_offre) = 'accord-cadre' THEN 'Accord cadre'
            ELSE COALESCE(type_offre, 'Non spécifié')
          END
        ORDER BY total DESC
      `, dateParams)
    ]);

    // Calculer les taux globaux
    const totalOffres = parseInt(stats.rows[0].total_offres);
    const offresApprouvees = parseInt(stats.rows[0].offres_approuvees);
    const offresRejetees = parseInt(stats.rows[0].offres_rejetees);
    const offresEnAttente = parseInt(stats.rows[0].offres_en_attente);
    
    const tauxGagnees = totalOffres > 0 ? Math.round((offresApprouvees / totalOffres) * 100) : 0;
    const tauxPerdues = totalOffres > 0 ? Math.round((offresRejetees / totalOffres) * 100) : 0;
    const tauxEnCours = totalOffres > 0 ? Math.round((offresEnAttente / totalOffres) * 100) : 0;

    const response = {
      stats: {
        totalOffres,
        offresApprouvees,
        offresEnAttente,
        offresRejetees,
        offresPrioritaires: parseInt(stats.rows[0].offres_prioritaires),
        tauxApprobation: totalOffres > 0 ? Math.round((offresApprouvees / totalOffres) * 100) : 0,
        tauxGagnees,
        tauxPerdues,
        tauxEnCours
      },
      typesOffre: typesOffre.rows.map(row => ({
        nom: row.nom || 'Non spécifié',
        total: parseInt(row.total),
        gagnees: parseInt(row.gagnees),
        perdues: parseInt(row.perdues),
        tauxGagnees: parseFloat(row.taux_gagnees),
        tauxPerdues: parseFloat(row.taux_perdues)
      }))
    };

    console.log('✅ Vue d\'ensemble des performances récupérée avec succès');
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la vue d\'ensemble:', error);
    res.status(500).json({ 
      error: 'Impossible de récupérer les données de performance',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

// GET - Analyse détaillée par pôle
router.get('/poles', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération de l\'analyse par pôle');
    
    const result = await query(`
      SELECT 
        pole_lead as nom_pole,
        COUNT(*) as total_offres,
        COUNT(CASE WHEN statut = 'approuvée' THEN 1 END) as offres_approuvees,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as offres_en_attente,
        COUNT(CASE WHEN statut = 'rejetée' THEN 1 END) as offres_rejetees,
        COUNT(CASE WHEN priorite = 'haute' THEN 1 END) as offres_prioritaires,
        CAST(
          (CAST(COUNT(CASE WHEN statut = 'approuvée' THEN 1 END) AS FLOAT) / COUNT(*)) * 100 AS DECIMAL(5,1)
        ) as taux_reussite
      FROM offres
      WHERE pole_lead IS NOT NULL
      GROUP BY pole_lead
      ORDER BY taux_reussite DESC
    `);

    const response = result.rows.map(pole => ({
      nom: pole.nom_pole,
      totalOffres: parseInt(pole.total_offres),
      offresApprouvees: parseInt(pole.offres_approuvees),
      offresEnAttente: parseInt(pole.offres_en_attente),
      offresRejetees: parseInt(pole.offres_rejetees),
      offresPrioritaires: parseInt(pole.offres_prioritaires),
      tauxReussite: parseFloat(pole.taux_reussite)
    }));

    console.log('✅ Analyse par pôle récupérée avec succès');
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse par pôle:', error);
    res.status(500).json({ 
      error: 'Impossible de récupérer l\'analyse par pôle',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

// GET - Analyse des tendances temporelles
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des tendances temporelles');
    
    const result = await query(`
      SELECT 
        EXTRACT(YEAR FROM created_at) as annee,
        EXTRACT(MONTH FROM created_at) as mois,
        TO_CHAR(created_at, 'Month YYYY') as periode,
        COUNT(*) as total_offres,
        COUNT(CASE WHEN statut = 'approuvée' THEN 1 END) as offres_approuvees,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as offres_en_attente,
        COUNT(CASE WHEN statut = 'rejetée' THEN 1 END) as offres_rejetees
      FROM offres
      WHERE created_at >= CURRENT_DATE - INTERVAL '24 months'
      GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Month YYYY')
      ORDER BY annee DESC, mois DESC
      LIMIT 24
    `);

    const response = result.rows.map(trend => ({
      annee: parseInt(trend.annee),
      mois: parseInt(trend.mois),
      periode: trend.periode,
      totalOffres: parseInt(trend.total_offres),
      offresApprouvees: parseInt(trend.offres_approuvees),
      offresEnAttente: parseInt(trend.offres_en_attente),
      offresRejetees: parseInt(trend.offres_rejetees),
      tauxReussite: trend.total_offres > 0 ? 
        Math.round((trend.offres_approuvees / trend.total_offres) * 100) : 0
    }));

    console.log('✅ Tendances temporelles récupérées avec succès');
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tendances:', error);
    res.status(500).json({ 
      error: 'Impossible de récupérer les tendances temporelles',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

// GET - Analyse comparative des commerciaux
router.get('/commerciaux', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération de l\'analyse comparative des commerciaux');
    
    const result = await query(`
      SELECT 
        u.username as nom_commercial,
        u.role as role_utilisateur,
        COUNT(o.id) as total_offres,
        COUNT(CASE WHEN o.statut = 'approuvée' THEN 1 END) as offres_approuvees,
        COUNT(CASE WHEN o.statut = 'en_attente' THEN 1 END) as offres_en_attente,
        COUNT(CASE WHEN o.statut = 'rejetée' THEN 1 END) as offres_rejetees,
        COUNT(CASE WHEN o.priorite = 'haute' THEN 1 END) as offres_prioritaires,
        CAST(
          (CAST(COUNT(CASE WHEN o.statut = 'approuvée' THEN 1 END) AS FLOAT) / COUNT(o.id)) * 100 AS DECIMAL(5,1)
        ) as taux_reussite,
        MIN(o.created_at) as premiere_offre,
        MAX(o.created_at) as derniere_offre
      FROM users u
      LEFT JOIN offres o ON u.id = o.created_by
      WHERE u.role IN ('user', 'manager', 'charge_partenariat')
      GROUP BY u.id, u.username, u.role
      HAVING COUNT(o.id) > 0
      ORDER BY taux_reussite DESC, total_offres DESC
    `);

    const response = result.rows.map(commercial => ({
      nom: commercial.nom_commercial,
      role: commercial.role_utilisateur,
      totalOffres: parseInt(commercial.total_offres),
      offresApprouvees: parseInt(commercial.offres_approuvees),
      offresEnAttente: parseInt(commercial.offres_en_attente),
      offresRejetees: parseInt(commercial.offres_rejetees),
      offresPrioritaires: parseInt(commercial.offres_prioritaires),
      tauxReussite: parseFloat(commercial.taux_reussite),
      premiereOffre: commercial.premiere_offre,
      derniereOffre: commercial.derniere_offre
    }));

    console.log('✅ Analyse comparative des commerciaux récupérée avec succès');
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des commerciaux:', error);
    res.status(500).json({ 
      error: 'Impossible de récupérer l\'analyse des commerciaux',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

// GET - Métriques de qualité et d'efficacité
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération des métriques de qualité et d\'efficacité');
    
    const [qualityMetrics, efficiencyMetrics] = await Promise.all([
      // Métriques de qualité
      query(`
        SELECT 
          COUNT(*) as total_offres,
          COUNT(CASE WHEN statut = 'approuvée' THEN 1 END) as offres_approuvees,
          COUNT(CASE WHEN statut = 'rejetée' THEN 1 END) as offres_rejetees,
          COUNT(CASE WHEN priorite = 'haute' THEN 1 END) as offres_prioritaires,
          COUNT(CASE WHEN pays IS NOT NULL AND pays != '' THEN 1 END) as offres_avec_pays,
          COUNT(CASE WHEN bailleur IS NOT NULL AND bailleur != '' THEN 1 END) as offres_avec_bailleur
        FROM offres
      `),
      
      // Métriques d'efficacité
      query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (date_soumission_validation - created_at))/86400) as delai_moyen_jours,
          COUNT(CASE WHEN date_soumission_validation IS NOT NULL THEN 1 END) as offres_soumises,
          COUNT(CASE WHEN date_soumission_validation IS NULL THEN 1 END) as offres_non_soumises
        FROM offres
        WHERE created_at IS NOT NULL
      `)
    ]);

    const response = {
      qualite: {
        totalOffres: parseInt(qualityMetrics.rows[0].total_offres),
        tauxApprobation: qualityMetrics.rows[0].total_offres > 0 ? 
          Math.round((qualityMetrics.rows[0].offres_approuvees / qualityMetrics.rows[0].total_offres) * 100) : 0,
        tauxRejet: qualityMetrics.rows[0].total_offres > 0 ? 
          Math.round((qualityMetrics.rows[0].offres_rejetees / qualityMetrics.rows[0].total_offres) * 100) : 0,
        offresPrioritaires: parseInt(qualityMetrics.rows[0].offres_prioritaires),
        completudePays: qualityMetrics.rows[0].total_offres > 0 ? 
          Math.round((qualityMetrics.rows[0].offres_avec_pays / qualityMetrics.rows[0].total_offres) * 100) : 0,
        completudeBailleur: qualityMetrics.rows[0].total_offres > 0 ? 
          Math.round((qualityMetrics.rows[0].offres_avec_bailleur / qualityMetrics.rows[0].total_offres) * 100) : 0
      },
      efficacite: {
        delaiMoyenJours: parseFloat(efficiencyMetrics.rows[0].delai_moyen_jours || 0).toFixed(1),
        offresSoumises: parseInt(efficiencyMetrics.rows[0].offres_soumises),
        offresNonSoumises: parseInt(efficiencyMetrics.rows[0].offres_non_soumises),
        tauxSoumission: (efficiencyMetrics.rows[0].offres_soumises + efficiencyMetrics.rows[0].offres_non_soumises) > 0 ? 
          Math.round((efficiencyMetrics.rows[0].offres_soumises / (efficiencyMetrics.rows[0].offres_soumises + efficiencyMetrics.rows[0].offres_non_soumises)) * 100) : 0
      }
    };

    console.log('✅ Métriques de qualité et d\'efficacité récupérées avec succès');
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des métriques:', error);
    res.status(500).json({ 
      error: 'Impossible de récupérer les métriques',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

// GET - Analyse détaillée par pôle avec indicateurs complets
router.get('/poles-detailed', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération de l\'analyse détaillée par pôle');
    
    // Récupérer les paramètres de date
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    let dateParams = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND o.created_at >= $1 AND o.created_at <= $2';
      dateParams = [startDate, endDate];
      console.log(`📅 Filtre de période: ${startDate} à ${endDate}`);
    }
    
    // Récupérer l'analyse détaillée par pôle
    const result = await query(`
      WITH pole_stats AS (
        SELECT 
          p.nom_pole,
          -- Offres attribuées en tant que pôle Lead
          COUNT(CASE WHEN o.pole_lead = p.nom_pole THEN 1 END) as offres_lead_attribuees,
          -- Offres attribuées en tant que pôle Associé
          COUNT(CASE WHEN o.pole_associes = p.nom_pole THEN 1 END) as offres_associe_attribuees,
          -- Offres montées en tant que pôle Lead
          COUNT(CASE WHEN o.pole_lead = p.nom_pole AND o.statut IN ('approuvée', 'rejetée') THEN 1 END) as offres_lead_montees,
          -- Offres montées en tant que pôle Associé
          COUNT(CASE WHEN o.pole_associes = p.nom_pole AND o.statut IN ('approuvée', 'rejetée') THEN 1 END) as offres_associe_montees,
          -- Total des offres gagnées (Lead + Associé)
          COUNT(CASE WHEN (o.pole_lead = p.nom_pole OR o.pole_associes = p.nom_pole) AND o.statut = 'approuvée' THEN 1 END) as offres_gagnees,
          -- Total des offres perdues (Lead + Associé)
          COUNT(CASE WHEN (o.pole_lead = p.nom_pole OR o.pole_associes = p.nom_pole) AND o.statut = 'rejetée' THEN 1 END) as offres_perdues,
          -- Total des offres en cours (Lead + Associé)
          COUNT(CASE WHEN (o.pole_lead = p.nom_pole OR o.pole_associes = p.nom_pole) AND o.statut = 'en_attente' THEN 1 END) as offres_en_cours,
          -- Total des offres (Lead + Associé)
          COUNT(CASE WHEN o.pole_lead = p.nom_pole OR o.pole_associes = p.nom_pole THEN 1 END) as total_offres
        FROM (
          SELECT DISTINCT nom_pole FROM (
            SELECT pole_lead as nom_pole FROM offres WHERE pole_lead IS NOT NULL
            UNION
            SELECT pole_associes as nom_pole FROM offres WHERE pole_associes IS NOT NULL
          ) poles_union
        ) p
        LEFT JOIN offres o ON (o.pole_lead = p.nom_pole OR o.pole_associes = p.nom_pole)
        WHERE 1=1 ${dateFilter}
        GROUP BY p.nom_pole
      )
      SELECT 
        nom_pole,
        offres_lead_attribuees,
        offres_associe_attribuees,
        offres_lead_montees,
        offres_associe_montees,
        offres_gagnees,
        offres_perdues,
        offres_en_cours,
        total_offres,
        CASE 
          WHEN total_offres > 0 THEN 
            ROUND(CAST((CAST(offres_gagnees AS FLOAT) / total_offres) * 100 AS NUMERIC), 1)
          ELSE 0 
        END as taux_succes,
        CASE 
          WHEN total_offres > 0 THEN 
            ROUND(CAST((CAST(offres_perdues AS FLOAT) / total_offres) * 100 AS NUMERIC), 1)
          ELSE 0 
        END as taux_perte,
        CASE 
          WHEN total_offres > 0 THEN 
            ROUND(CAST((CAST(offres_en_cours AS FLOAT) / total_offres) * 100 AS NUMERIC), 1)
          ELSE 0 
        END as taux_attente
      FROM pole_stats
      ORDER BY 
        CASE WHEN total_offres > 0 THEN (offres_gagnees::float / total_offres) ELSE 0 END DESC,
        total_offres DESC
    `, dateParams);

    const response = result.rows.map(pole => ({
      nom: pole.nom_pole,
      // Indicateurs principaux
      offresLeadAttribuees: parseInt(pole.offres_lead_attribuees),
      offresAssocieAttribuees: parseInt(pole.offres_associe_attribuees),
      offresLeadMontees: parseInt(pole.offres_lead_montees),
      offresAssocieMontees: parseInt(pole.offres_associe_montees),
      // Taux
      tauxSucces: parseFloat(pole.taux_succes),
      tauxPerte: parseFloat(pole.taux_perte),
      tauxAttente: parseFloat(pole.taux_attente),
      // Totaux
      totalOffres: parseInt(pole.total_offres),
      offresGagnees: parseInt(pole.offres_gagnees),
      offresPerdues: parseInt(pole.offres_perdues),
      offresEnCours: parseInt(pole.offres_en_cours)
    }));

    console.log('✅ Analyse détaillée par pôle récupérée avec succès');
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse détaillée par pôle:', error);
    res.status(500).json({ 
      error: 'Impossible de récupérer l\'analyse détaillée par pôle',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur'
    });
  }
});

module.exports = router;
