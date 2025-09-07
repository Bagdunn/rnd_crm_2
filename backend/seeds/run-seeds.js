const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runSeeds() {
  try {
    console.log('Starting database seeding...');
    
    // Check if seeds already executed
    const checkResult = await db.query('SELECT COUNT(*) as count FROM items');
    const itemCount = parseInt(checkResult.rows[0].count);
    
    if (itemCount > 0) {
      console.log('⏭ Seeds already executed, skipping...');
      process.exit(0);
    }
    
    const seedFile = path.join(__dirname, 'seed-data.sql');
    const sql = fs.readFileSync(seedFile, 'utf8');
    
    await db.query(sql);
    console.log('✓ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
