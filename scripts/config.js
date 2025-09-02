// Configuration pour l'import des partenaires
module.exports = {
  // Configuration de la base de données
  database: {
    host: 'localhost',
    port: 5432,
    database: 'bms_db',
    user: 'postgres',
    password: 'password' // Changez ceci selon votre configuration
  },
  
  // Configuration de l'import
  import: {
    // Champs obligatoires
    requiredFields: ['NOM DU BUREAU', 'CONTACT', 'DOMAINE D\'EXPERTISE', 'PAYS'],
    
    // Mapping des colonnes Excel vers la base de données
    columnMapping: {
      'NOM DU BUREAU': 'nom_bureau',
      'CONTACT': 'contact',
      'CABINETS AYANT POSTULE': 'cabinets_ayant_postule',
      'CONTACTS': 'contacts',
      'DOMAINE D\'EXPERTISE': 'domaine_expertise',
      'PAYS': 'pays',
      'MARCHE GAGNE': 'marche_gagne',
      'DUREE': 'duree',
      'BAILLEUR': 'bailleur',
      'VALEUR': 'valeur',
      'MARCHE ATTRIBUE LE': 'marche_attribue_le'
    },
    
    // Validation des données
    validation: {
      maxStringLength: 255,
      dateFormats: ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']
    }
  }
};
