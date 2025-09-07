const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runSeeds() {
  try {
    console.log('Starting database seeding...');
    
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
