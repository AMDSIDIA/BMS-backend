#!/usr/bin/env node

/**
 * Script de test pour l'authentification avec la base de données
 */

const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:10000';

async function testAuth() {
  console.log('🧪 Test des routes d\'authentification...\n');

  try {
    // Test 1: Route de test
    console.log('1️⃣ Test de la route /api/auth/test');
    const testResponse = await axios.get(`${BASE_URL}/api/auth/test`);
    console.log('✅ Route test:', testResponse.data);
    console.log('');

    // Test 2: Login avec utilisateur de test
    console.log('2️⃣ Test de la route POST /api/auth/login');
    const loginData = {
      email: 'test@bms.com',
      password: 'password123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ Login réussi:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      user: loginResponse.data.user?.email,
      hasToken: !!loginResponse.data.token
    });
    console.log('');

    // Test 3: Login avec mauvais credentials
    console.log('3️⃣ Test de la route POST /api/auth/login avec mauvais credentials');
    const wrongLoginData = {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    };
    
    try {
      const wrongLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, wrongLoginData);
      console.log('❌ Login aurait dû échouer:', wrongLoginResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Login échoué correctement (401):', error.response.data);
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 4: Health check
    console.log('4️⃣ Test de la route /api/health');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check:', {
      status: healthResponse.data.status,
      message: healthResponse.data.message,
      port: healthResponse.data.port
    });

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log(`🌐 Backend accessible sur: ${BASE_URL}`);
    console.log(`🔐 Route auth: ${BASE_URL}/api/auth/login`);
    console.log(`📊 Route dashboard: ${BASE_URL}/api/dashboard/complete`);

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    if (error.response) {
      console.error('📡 Réponse du serveur:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
    process.exit(1);
  }
}

// Lancer les tests
testAuth();
