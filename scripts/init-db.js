const { pool, initDatabase } = require('../config/database');

async function main() {
  try {
    console.log('🚀 Initializing BMS database...');
    await initDatabase();
    console.log('✅ Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

main();
