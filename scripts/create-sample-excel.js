const XLSX = require('xlsx');

// Données d'exemple pour les partenaires
const sampleData = [
  {
    'NOM DU BUREAU': 'Cabinet ABC Consulting',
    'CONTACT': 'Jean Dupont',
    'CABINETS AYANT POSTULE': 'Cabinet XYZ, Cabinet DEF',
    'CONTACTS': '+33 1 23 45 67 89, jean.dupont@abc.com',
    'DOMAINE D\'EXPERTISE': 'Ingénierie',
    'PAYS': 'France',
    'MARCHE GAGNE': 'Projet Route Nationale A1',
    'DUREE': '12 mois',
    'BAILLEUR': 'Banque Mondiale',
    'VALEUR': '500,000 EUR',
    'MARCHE ATTRIBUE LE': '2024-01-15'
  },
  {
    'NOM DU BUREAU': 'Bureau LMN Architecture',
    'CONTACT': 'Marie Martin',
    'CABINETS AYANT POSTULE': 'Cabinet GHI',
    'CONTACTS': '+33 1 98 76 54 32, marie.martin@lmn.fr',
    'DOMAINE D\'EXPERTISE': 'Architecture',
    'PAYS': 'Belgique',
    'MARCHE GAGNE': 'Construction Pont de Bruxelles',
    'DUREE': '18 mois',
    'BAILLEUR': 'Union Européenne',
    'VALEUR': '750,000 EUR',
    'MARCHE ATTRIBUE LE': '2024-02-20'
  },
  {
    'NOM DU BUREAU': 'Studio OPQ Design',
    'CONTACT': 'Pierre Durand',
    'CABINETS AYANT POSTULE': 'Studio RST, Bureau UVW',
    'CONTACTS': '+33 1 45 67 89 12, pierre.durand@opq.com',
    'DOMAINE D\'EXPERTISE': 'Design Urbain',
    'PAYS': 'Suisse',
    'MARCHE GAGNE': 'Aménagement Place Centrale Genève',
    'DUREE': '24 mois',
    'BAILLEUR': 'Ville de Genève',
    'VALEUR': '1,200,000 CHF',
    'MARCHE ATTRIBUE LE': '2024-03-10'
  },
  {
    'NOM DU BUREAU': 'Groupe EFG Engineering',
    'CONTACT': 'Sophie Bernard',
    'CABINETS AYANT POSTULE': 'Bureau HIJ, Cabinet KLM',
    'CONTACTS': '+33 1 67 89 12 34, sophie.bernard@efg.fr',
    'DOMAINE D\'EXPERTISE': 'Génie Civil',
    'PAYS': 'Luxembourg',
    'MARCHE GAGNE': 'Tunnel Autoroutier A6',
    'DUREE': '36 mois',
    'BAILLEUR': 'État Luxembourgeois',
    'VALEUR': '2,500,000 EUR',
    'MARCHE ATTRIBUE LE': '2024-04-05'
  },
  {
    'NOM DU BUREAU': 'Consulting RST',
    'CONTACT': 'Marc Leroy',
    'CABINETS AYANT POSTULE': 'Bureau NOP',
    'CONTACTS': '+33 1 89 12 34 56, marc.leroy@rst.fr',
    'DOMAINE D\'EXPERTISE': 'Conseil en Management',
    'PAYS': 'Allemagne',
    'MARCHE GAGNE': 'Restructuration Entreprise Industrielle',
    'DUREE': '6 mois',
    'BAILLEUR': 'Banque Européenne d\'Investissement',
    'VALEUR': '300,000 EUR',
    'MARCHE ATTRIBUE LE': '2024-05-12'
  }
];

// Créer le workbook
const workbook = XLSX.utils.book_new();

// Créer la worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Ajouter la worksheet au workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Partenaires');

// Définir la largeur des colonnes
const columnWidths = [
  { wch: 25 }, // NOM DU BUREAU
  { wch: 20 }, // CONTACT
  { wch: 30 }, // CABINETS AYANT POSTULE
  { wch: 35 }, // CONTACTS
  { wch: 20 }, // DOMAINE D'EXPERTISE
  { wch: 15 }, // PAYS
  { wch: 30 }, // MARCHE GAGNE
  { wch: 15 }, // DUREE
  { wch: 25 }, // BAILLEUR
  { wch: 20 }, // VALEUR
  { wch: 20 }  // MARCHE ATTRIBUE LE
];

worksheet['!cols'] = columnWidths;

// Écrire le fichier
const outputPath = './partenariat-exemple.xlsx';
XLSX.writeFile(workbook, outputPath);

console.log('✅ Fichier Excel d\'exemple créé avec succès !');
console.log(`📁 Fichier: ${outputPath}`);
console.log('');
console.log('📋 Structure du fichier:');
console.log('  - Première ligne: En-têtes des colonnes');
console.log('  - Lignes suivantes: Données des partenaires');
console.log('  - 5 partenaires d\'exemple inclus');
console.log('');
console.log('💡 Utilisez ce fichier pour tester l\'import:');
console.log(`   node import-partenariat.js ${outputPath}`);
