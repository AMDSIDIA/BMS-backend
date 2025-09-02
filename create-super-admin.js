const bcrypt = require('bcryptjs');
const { query } = require('./config/database');

async function createSuperAdmin() {
  try {
    console.log('🚀 Création du compte Super Admin de test...');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query('SELECT * FROM users WHERE email = $1', ['superadmin@bms.com']);
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Le compte superadmin@bms.com existe déjà');
      console.log('📧 Email: superadmin@bms.com');
      console.log('🔑 Mot de passe: admin1234');
      console.log('👤 Rôle: s_admin');
      return;
    }
    
    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin1234', saltRounds);
    
    // Créer l'utilisateur super admin
    const result = await query(
      `INSERT INTO users (username, email, password_hash, nom, prenom, role, sexe) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, email, nom, prenom, role`,
      [
        'superadmin',
        'superadmin@bms.com',
        hashedPassword,
        'Super',
        'Administrateur',
        's_admin',
        'Mr'
      ]
    );
    
    const newUser = result.rows[0];
    
    console.log('✅ Compte Super Admin créé avec succès !');
    console.log('📧 Email: superadmin@bms.com');
    console.log('🔑 Mot de passe: admin1234');
    console.log('👤 Rôle: s_admin');
    console.log('🆔 ID utilisateur:', newUser.id);
    console.log('👨 Nom complet:', `${newUser.prenom} ${newUser.nom}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du Super Admin:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le script
createSuperAdmin();
