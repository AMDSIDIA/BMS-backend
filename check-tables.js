#!/usr/bin/env node

/**
 * Script pour vérifier la structure des tables de la base de données BMS
 */

const { query, closeConnection } = require('./config/database');

async function checkTables() {
  try {
    console.log('🔍 Vérification de la structure des tables BMS');
    console.log('=' .repeat(50));
    
    // Vérifier la table users
    console.log('\n📋 Table users:');
    try {
      const usersStructure = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      usersStructure.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } catch (error) {
      console.error('   ❌ Erreur:', error.message);
    }
    
    // Vérifier la table offres
    console.log('\n📋 Table offres:');
    try {
      const offresStructure = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'offres' 
        ORDER BY ordinal_position
      `);
      
      offresStructure.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } catch (error) {
      console.error('   ❌ Erreur:', error.message);
    }
    
    // Lister toutes les tables
    console.log('\n📋 Toutes les tables:');
    try {
      const tables = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      tables.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } catch (error) {
      console.error('   ❌ Erreur:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    await closeConnection();
  }
}

if (require.main === module) {
  checkTables();
}

module.exports = { checkTables };
