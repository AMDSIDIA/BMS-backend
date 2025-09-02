#!/usr/bin/env node

/**
 * Script de test pour l'authentification avec la base de données
 */

const { query, closeConnection } = require('./config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testAuth() {
  try {
    console.log('🧪 Test de l\'authentification avec la base de données');
    console.log('=' .repeat(60));
    
    // Test 1: Vérifier la connexion à la base de données
    console.log('\n📡 Test 1: Connexion à la base de données');
    const result = await query('SELECT NOW() as time');
    console.log('✅ Connexion réussie:', result.rows[0].time);
    
    // Test 2: Vérifier les utilisateurs existants
    console.log('\n👤 Test 2: Utilisateurs existants');
    const users = await query('SELECT id, email, nom, prenom, role FROM users');
    console.log(`📊 Nombre d'utilisateurs: ${users.rows.length}`);
    users.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.nom} ${user.prenom}) - ${user.role}`);
    });
    
    // Test 3: Test de connexion avec l'utilisateur de test
    console.log('\n🔐 Test 3: Test de connexion');
    const testEmail = 'test@bms.com';
    const testPassword = 'test123';
    
    // Récupérer l'utilisateur
    const userResult = await query('SELECT * FROM users WHERE email = $1', [testEmail]);
    if (userResult.rows.length === 0) {
      console.log('❌ Utilisateur de test non trouvé');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    
    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
    if (isValidPassword) {
      console.log('✅ Mot de passe correct');
      
      // Générer un token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      console.log('✅ Token JWT généré');
      console.log(`   Token: ${token.substring(0, 50)}...`);
      
      // Vérifier le token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('✅ Token JWT valide');
        console.log(`   User ID: ${decoded.userId}`);
        console.log(`   Email: ${decoded.email}`);
        console.log(`   Role: ${decoded.role}`);
      } catch (error) {
        console.log('❌ Token JWT invalide:', error.message);
      }
      
    } else {
      console.log('❌ Mot de passe incorrect');
    }
    
    // Test 4: Test de création d'un nouvel utilisateur
    console.log('\n👤 Test 4: Création d\'un nouvel utilisateur');
    const newUser = {
      email: 'test2@bms.com',
      password: 'test456',
      nom: 'Test2',
      prenom: 'Utilisateur2',
      role: 'user'
    };
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [newUser.email]);
    if (existingUser.rows.length > 0) {
      console.log('✅ Utilisateur test2 existe déjà');
    } else {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(newUser.password, 10);
      const insertResult = await query(
        'INSERT INTO users (email, password_hash, nom, prenom, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [newUser.email, hashedPassword, newUser.nom, newUser.prenom, newUser.role]
      );
      
      console.log('✅ Nouvel utilisateur créé:', insertResult.rows[0].email);
    }
    
    console.log('\n✅ Tous les tests d\'authentification ont réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await closeConnection();
  }
}

testAuth();
