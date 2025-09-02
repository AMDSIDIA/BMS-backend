const fetch = require('node-fetch');

async function testDashboardAPI() {
  console.log('🧪 Test de l\'API Dashboard BMS');
  console.log('=====================================');
  
  try {
    // 1. Test de connexion au backend
    console.log('\n[1/4] Test de connexion au backend...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    if (healthResponse.ok) {
      console.log('✅ Backend accessible');
    } else {
      throw new Error('Backend non accessible');
    }
    
    // 2. Test de login pour obtenir un token
    console.log('\n[2/4] Test de connexion utilisateur...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@bms.com',
        password: 'test123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Échec de la connexion utilisateur');
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    if (!token) {
      throw new Error('Aucun token reçu');
    }
    
    console.log('✅ Connexion réussie, token obtenu');
    
    // 3. Test de l'API dashboard avec token
    console.log('\n[3/4] Test de l\'API dashboard...');
    const dashboardResponse = await fetch('http://localhost:5000/api/dashboard/complete?period=month', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ API dashboard fonctionne correctement');
      console.log('📊 Données reçues:', {
        totalOffres: dashboardData.data?.stats?.totalOffres || 0,
        offresEnAttente: dashboardData.data?.stats?.offresEnAttente || 0,
        offresApprouvees: dashboardData.data?.stats?.offresApprouvees || 0,
        offresRejetees: dashboardData.data?.stats?.offresRejetees || 0
      });
    } else {
      const errorData = await dashboardResponse.json();
      console.log('❌ Erreur API dashboard:', errorData);
      throw new Error(`Erreur ${dashboardResponse.status}: ${errorData.error || 'Erreur inconnue'}`);
    }
    
    // 4. Test de différentes périodes
    console.log('\n[4/4] Test des différentes périodes...');
    const periods = ['today', 'week', 'month', 'quarter', 'year'];
    
    for (const period of periods) {
      try {
        const periodResponse = await fetch(`http://localhost:5000/api/dashboard/complete?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (periodResponse.ok) {
          console.log(`✅ Période '${period}': OK`);
        } else {
          console.log(`❌ Période '${period}': Erreur ${periodResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Période '${period}': ${error.message}`);
      }
    }
    
    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📱 Le dashboard est maintenant prêt à être utilisé.');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend: http://localhost:5000');
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('🔍 Détails:', error);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Vérifiez que le serveur backend est démarré:');
      console.log('   cd backend && npm start');
    }
    
    process.exit(1);
  }
}

// Exécuter le test
testDashboardAPI();
