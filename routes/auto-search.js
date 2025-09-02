const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cheerio = require('cheerio');

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

// Configuration des sites de recherche
const SEARCH_SITES = {
  BOAMP: {
    name: 'BOAMP',
    baseUrl: 'https://www.boamp.fr',
    searchUrl: 'https://www.boamp.fr/recherche',
    icon: '🏛️',
    description: 'Bulletin Officiel des Annonces de Marchés Publics'
  },
  Legifrance: {
    name: 'Legifrance',
    baseUrl: 'https://www.legifrance.gouv.fr',
    searchUrl: 'https://www.legifrance.gouv.fr/recherche',
    icon: '⚖️',
    description: 'Journal Officiel et consultations publiques'
  },
  EuropeanTenders: {
    name: 'European Tenders',
    baseUrl: 'https://www.european-tenders.com',
    searchUrl: 'https://www.european-tenders.com/search',
    icon: '🇪🇺',
    description: 'Appels d\'offres européens'
  },
  J360: {
    name: 'J360',
    baseUrl: 'https://www.j360.info',
    searchUrl: 'https://www.j360.info/search',
    icon: '🌍',
    description: 'Plateforme d\'opportunités internationales'
  },
  DevelopmentAid: {
    name: 'DevelopmentAid',
    baseUrl: 'https://www.developmentaid.org',
    searchUrl: 'https://www.developmentaid.org/tenders/search',
    icon: '🌍',
    description: 'Opportunités de développement international'
  },
  BM: {
    name: 'BM',
    baseUrl: 'https://www.worldbank.org',
    searchUrl: 'https://www.worldbank.org/en/projects-operations/procurement',
    icon: '📊',
    description: 'Banque Mondiale - Appels d\'offres'
  },
  ReliefWeb: {
    name: 'ReliefWeb',
    baseUrl: 'https://reliefweb.int',
    searchUrl: 'https://reliefweb.int/opportunities',
    icon: '🆘',
    description: 'Opportunités humanitaires et d\'urgence'
  },
  CoordinationSud: {
    name: 'Coordination Sud',
    baseUrl: 'https://www.coordinationsud.org',
    searchUrl: 'https://www.coordinationsud.org/opportunites',
    icon: '🤝',
    description: 'Réseau des ONG françaises'
  }
};

// POST /api/auto-search - Recherche automatique sur les sites externes
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { keywords, sites = Object.keys(SEARCH_SITES), maxResults = 50 } = req.body;

    if (!keywords || !keywords.trim()) {
      return res.status(400).json({ 
        error: 'Mots-clés de recherche requis' 
      });
    }

    console.log(`🔍 Recherche automatique pour: "${keywords}" sur ${sites.length} sites`);

    const searchPromises = sites.map(async (siteKey) => {
      if (!SEARCH_SITES[siteKey]) {
        return { site: siteKey, error: 'Site non supporté' };
      }

      try {
        const site = SEARCH_SITES[siteKey];
        console.log(`🔍 Recherche sur ${site.name}...`);

        // Simulation de recherche (remplacer par de vraies API calls)
        const results = await simulateSearch(site, keywords, maxResults);
        
        return {
          site: siteKey,
          siteInfo: site,
          results: results,
          success: true
        };
      } catch (error) {
        console.error(`❌ Erreur sur ${siteKey}:`, error.message);
        return {
          site: siteKey,
          error: error.message,
          success: false
        };
      }
    });

    const searchResults = await Promise.allSettled(searchPromises);
    
    // Traiter les résultats
    const processedResults = searchResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(result => result.success);

    // Agréger tous les résultats
    const allResults = processedResults.flatMap(siteResult => 
      siteResult.results.map(result => ({
        ...result,
        source: siteResult.siteInfo.name,
        sourceIcon: siteResult.siteInfo.icon,
        sourceUrl: siteResult.siteInfo.baseUrl
      }))
    );

    // Trier par pertinence et date
    allResults.sort((a, b) => {
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Limiter le nombre de résultats
    const finalResults = allResults.slice(0, maxResults);

    console.log(`✅ Recherche terminée: ${finalResults.length} résultats trouvés`);

    res.json({
      success: true,
      keywords: keywords.trim(),
      sites_searched: sites,
      total_results: finalResults.length,
      results: finalResults,
      search_summary: {
        sites_successful: processedResults.length,
        sites_failed: searchResults.length - processedResults.length,
        search_time: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la recherche automatique:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la recherche automatique',
      details: error.message 
    });
  }
});

// GET /api/auto-search/sites - Liste des sites supportés
router.get('/sites', authenticateToken, async (req, res) => {
  try {
    const sitesList = Object.entries(SEARCH_SITES).map(([key, site]) => ({
      key: key,
      name: site.name,
      icon: site.icon,
      description: site.description,
      baseUrl: site.baseUrl,
      searchUrl: site.searchUrl
    }));

    res.json({
      success: true,
      sites: sitesList,
      total_sites: sitesList.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des sites:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des sites',
      details: error.message 
    });
  }
});

// GET /api/auto-search/status - Statut des sites de recherche
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const statusPromises = Object.entries(SEARCH_SITES).map(async ([key, site]) => {
      try {
        const startTime = Date.now();
        const response = await axios.get(site.baseUrl, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        return {
          site: key,
          name: site.name,
          status: 'online',
          response_time: responseTime,
          status_code: response.status,
          last_check: new Date().toISOString()
        };
      } catch (error) {
        return {
          site: key,
          name: site.name,
          status: 'offline',
          error: error.message,
          last_check: new Date().toISOString()
        };
      }
    });

    const statusResults = await Promise.allSettled(statusPromises);
    const sitesStatus = statusResults
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const summary = {
      total_sites: sitesStatus.length,
      online_sites: sitesStatus.filter(site => site.status === 'online').length,
      offline_sites: sitesStatus.filter(site => site.status === 'offline').length
    };

    res.json({
      success: true,
      summary: summary,
      sites: sitesStatus,
      last_check: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la vérification du statut',
      details: error.message 
    });
  }
});

// Fonction de simulation de recherche (à remplacer par de vraies API calls)
async function simulateSearch(site, keywords, maxResults) {
  // Simulation d'un délai de recherche
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  
  // Générer des résultats simulés
  const numResults = Math.floor(Math.random() * maxResults) + 1;
  const results = [];
  
  for (let i = 0; i < numResults; i++) {
    const relevance = Math.random() * 0.8 + 0.2; // Pertinence entre 0.2 et 1.0
    
    results.push({
      id: `${site.name.toLowerCase()}_${Date.now()}_${i}`,
      title: generateSimulatedTitle(keywords, site.name),
      description: generateSimulatedDescription(keywords, site.name),
      url: `${site.baseUrl}/opportunity/${Date.now()}_${i}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      relevance: relevance,
      estimated_value: Math.floor(Math.random() * 1000000) + 10000,
      deadline: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      location: generateSimulatedLocation(),
      category: generateSimulatedCategory(keywords)
    });
  }
  
  // Trier par pertinence
  results.sort((a, b) => b.relevance - a.relevance);
  
  return results;
}

// Fonctions utilitaires pour générer du contenu simulé
function generateSimulatedTitle(keywords, siteName) {
  const prefixes = [
    'Appel d\'offres pour',
    'Consultation publique sur',
    'Marché public de',
    'Opportunité de',
    'Projet de',
    'Services de'
  ];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix} ${keywords} - ${siteName}`;
}

function generateSimulatedDescription(keywords, siteName) {
  const descriptions = [
    `Ce projet vise à développer des solutions innovantes dans le domaine de ${keywords}.`,
    `Opportunité unique pour des entreprises spécialisées en ${keywords}.`,
    `Marché public important dans le secteur de ${keywords}.`,
    `Consultation pour la mise en œuvre de services de ${keywords}.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateSimulatedLocation() {
  const locations = [
    'France', 'Europe', 'Afrique', 'Asie', 'Amérique du Nord',
    'Paris', 'Lyon', 'Marseille', 'Bruxelles', 'Genève'
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
}

function generateSimulatedCategory(keywords) {
  const categories = [
    'Informatique', 'Construction', 'Services', 'Formation',
    'Consultation', 'Développement', 'Maintenance', 'Innovation'
  ];
  
  return categories[Math.floor(Math.random() * categories.length)];
}

module.exports = router;
