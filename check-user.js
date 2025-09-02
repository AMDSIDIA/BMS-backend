const { query } = require('./config/database');

async function checkUser() {
  try {
    console.log('🔍 Vérification du compte super admin...');
    
    const result = await query('SELECT * FROM users WHERE email = $1', ['superadmin@bms.com']);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Utilisateur trouvé:');
      console.log('📧 Email:', user.email);
      console.log('👤 Nom:', user.nom);
      console.log('👤 Prénom:', user.prenom);
      console.log('🔑 Rôle:', user.role);
      console.log('🆔 ID:', user.id);
      console.log('📅 Créé le:', user.created_at);
    } else {
      console.log('❌ Utilisateur non trouvé');
    }
    
    // Lister tous les utilisateurs
    console.log('\n📋 Liste de tous les utilisateurs:');
    const allUsers = await query('SELECT id, email, nom, prenom, role FROM users');
    allUsers.rows.forEach(user => {
      console.log(`- ${user.email} (${user.prenom} ${user.nom}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    process.exit(0);
  }
}

checkUser();
