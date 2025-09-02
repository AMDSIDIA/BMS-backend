const { Pool } = require('pg');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Configuration de la base de données depuis config.js
const pool = new Pool(config.database);

// Fonction pour nettoyer et valider les données
function cleanData(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Convertir en string et nettoyer
  let cleaned = String(value).trim();
  
  // Si c'est une date, la formater correctement
  if (cleaned.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [day, month, year] = cleaned.split('/');
    cleaned = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return cleaned;
}

// Fonction pour mapper les colonnes Excel aux colonnes de la base
function mapExcelColumns(row, headers) {
  const mapping = config.import.columnMapping;
  const mappedData = {};
  
  headers.forEach((header, index) => {
    const dbColumn = mapping[header];
    if (dbColumn) {
      mappedData[dbColumn] = cleanData(row[index]);
    }
  });

  return mappedData;
}

// Fonction pour insérer un partenaire
async function insertPartenaire(data) {
  const query = `
    INSERT INTO partenaires (
      nom_bureau, contact, cabinets_ayant_postule, contacts, 
      domaine_expertise, pays, marche_gagne, duree, 
      bailleur, valeur, marche_attribue_le
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id
  `;

  const values = [
    data.nom_bureau,
    data.contact,
    data.cabinets_ayant_postule,
    data.contacts,
    data.domaine_expertise,
    data.pays,
    data.marche_gagne,
    data.duree,
    data.bailleur,
    data.valeur,
    data.marche_attribue_le
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('Erreur lors de l\'insertion:', error.message);
    throw error;
  }
}

// Fonction principale d'import
async function importPartenariat(filePath) {
  try {
    console.log('🚀 Début de l\'import des partenaires...');
    console.log('📋 Configuration utilisée:');
    console.log(`  - Host: ${config.database.host}`);
    console.log(`  - Port: ${config.database.port}`);
    console.log(`  - Database: ${config.database.database}`);
    console.log(`  - User: ${config.database.user}`);
    console.log('');
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier non trouvé: ${filePath}`);
    }

    // Lire le fichier Excel
    console.log('📖 Lecture du fichier Excel...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('Le fichier Excel doit contenir au moins un en-tête et une ligne de données');
    }

    // Extraire les en-têtes (première ligne)
    const headers = jsonData[0];
    console.log('📋 En-têtes détectés:', headers);

    // Vérifier les champs obligatoires
    const missingRequired = config.import.requiredFields.filter(field => !headers.includes(field));
    if (missingRequired.length > 0) {
      throw new Error(`Champs obligatoires manquants: ${missingRequired.join(', ')}`);
    }

    // Traiter les données (à partir de la deuxième ligne)
    const dataRows = jsonData.slice(1);
    console.log(`📊 ${dataRows.length} lignes de données à traiter`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Traiter chaque ligne
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 car on commence à la ligne 2 (après les en-têtes)

      try {
        // Vérifier que la ligne n'est pas vide
        if (row.every(cell => !cell || cell.toString().trim() === '')) {
          console.log(`⚠️  Ligne ${rowNumber}: Ligne vide, ignorée`);
          continue;
        }

        // Mapper les données
        const mappedData = mapExcelColumns(row, headers);

        // Validation des champs obligatoires
        const missingFields = config.import.requiredFields.filter(field => {
          const dbField = config.import.columnMapping[field];
          return !mappedData[dbField];
        });

        if (missingFields.length > 0) {
          const error = `Ligne ${rowNumber}: Champs obligatoires manquants (${missingFields.join(', ')})`;
          console.error(`❌ ${error}`);
          errors.push(error);
          errorCount++;
          continue;
        }

        // Insérer dans la base
        const id = await insertPartenaire(mappedData);
        console.log(`✅ Ligne ${rowNumber}: Partenaire inséré avec l'ID ${id}`);
        successCount++;

      } catch (error) {
        const errorMsg = `Ligne ${rowNumber}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    // Résumé de l'import
    console.log('\n📊 RÉSUMÉ DE L\'IMPORT');
    console.log('========================');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📋 Total traité: ${dataRows.length}`);

    if (errors.length > 0) {
      console.log('\n❌ DÉTAIL DES ERREURS:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    if (successCount > 0) {
      console.log('\n🎉 Import terminé avec succès !');
    }

  } catch (error) {
    console.error('💥 Erreur fatale lors de l\'import:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Fonction pour vérifier la structure de la table
async function checkTableStructure() {
  try {
    console.log('🔍 Vérification de la structure de la table...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'partenaires'
      ORDER BY ordinal_position
    `);

    if (result.rows.length === 0) {
      throw new Error('La table "partenaires" n\'existe pas. Veuillez d\'abord exécuter le script de création.');
    }

    console.log('✅ Structure de la table vérifiée:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(obligatoire)' : '(optionnel)'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    throw error;
  }
}

// Point d'entrée principal
async function main() {
  try {
    // Vérifier les arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.log('📖 Usage: node import-partenariat.js <chemin_vers_fichier_excel>');
      console.log('📖 Exemple: node import-partenariat.js ./partenariat.xlsx');
      console.log('');
      console.log('💡 Conseil: Modifiez le fichier config.js si nécessaire pour ajuster la configuration de la base de données');
      process.exit(1);
    }

    const filePath = args[0];
    
    // Vérifier la structure de la table
    await checkTableStructure();
    
    // Lancer l'import
    await importPartenariat(filePath);

  } catch (error) {
    console.error('💥 Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { importPartenariat, checkTableStructure };
