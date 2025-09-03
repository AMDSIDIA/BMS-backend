const express = require('express');
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Middleware CORS simple pour les tests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes dashboard simplifiées pour les tests
app.get('/api/dashboard/test', (req, res) => {
  res.json({
    success: true,
    message: "Module dashboard fonctionne correctement",
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dashboard/complete', (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Données de test pour le dashboard complet
    const dashboardData = {
      message: "Dashboard complet OK",
      period: period,
      timestamp: new Date().toISOString(),
      stats: {
        totalOffres: 150,
        offresApprouvees: 45,
        offresEnAttente: 30,
        offresRejetees: 15,
        offresPrioritaires: 25,
        tauxApprobation: 75.5,
        tauxGagnees: 60.2,
        tauxPerdues: 25.3,
        tauxEnCours: 14.5
      },
      typesOffre: [
        {
          nom: "Consultation",
          total: 80,
          gagnees: 45,
          perdues: 20,
          tauxGagnees: 56.25
        },
        {
          nom: "Formation",
          total: 40,
          gagnees: 25,
          perdues: 10,
          tauxGagnees: 62.5
        },
        {
          nom: "Audit",
          total: 30,
          gagnees: 20,
          perdues: 5,
          tauxGagnees: 66.67
        }
      ],
      poles: [
        {
          nom: "Pôle Santé",
          totalOffres: 50,
          offresApprouvees: 20,
          offresEnAttente: 15,
          offresRejetees: 5,
          offresPrioritaires: 10,
          tauxReussite: 75.0
        },
        {
          nom: "Pôle Education",
          totalOffres: 40,
          offresApprouvees: 15,
          offresEnAttente: 10,
          offresRejetees: 5,
          offresPrioritaires: 8,
          tauxReussite: 70.0
        },
        {
          nom: "Pôle Wash",
          totalOffres: 30,
          offresApprouvees: 10,
          offresEnAttente: 5,
          offresRejetees: 5,
          offresPrioritaires: 7,
          tauxReussite: 66.67
        }
      ],
      recentActivity: [
        {
          id: 1,
          type: "offre_ajoutee",
          description: "Nouvelle offre ajoutée pour le Pôle Santé",
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: "admin@bms.com"
        },
        {
          id: 2,
          type: "offre_approuvee",
          description: "Offre 'Formation en santé publique' approuvée",
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user: "manager@bms.com"
        },
        {
          id: 3,
          type: "repartition_effectuee",
          description: "Répartition effectuée pour 3 offres",
          date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: "admin@bms.com"
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardData,
      message: "Données du dashboard récupérées avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: 'Impossible de récupérer les données du dashboard'
    });
  }
});

// Route de test simple
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Serveur de test fonctionne',
    endpoints: [
      '/api/dashboard/test',
      '/api/dashboard/complete',
      '/test'
    ]
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableRoutes: [
      '/api/dashboard/test',
      '/api/dashboard/complete',
      '/test'
    ]
  });
});

// Démarrer le serveur de test
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Serveur de test démarré sur le port ${PORT}`);
  console.log(`📊 Test dashboard complet: http://localhost:${PORT}/api/dashboard/complete`);
  console.log(`📋 Test dashboard simple: http://localhost:${PORT}/api/dashboard/test`);
  console.log(`🧪 Test serveur: http://localhost:${PORT}/test`);
  console.log(`🌐 CORS activé pour tous les domaines`);
});
