const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration - use DATABASE_URL if available (Railway), otherwise use individual variables
const pool = new Pool(
  process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.DB_HOST || 'postgres',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'rnd_crm',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres'
      }
);

async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Get already executed migrations
    let executedMigrations = [];
    try {
      const result = await client.query('SELECT filename FROM migrations ORDER BY id');
      executedMigrations = result.rows.map(row => row.filename);
      console.log(`Found ${executedMigrations.length} already executed migrations`);
    } catch (error) {
      // Migrations table doesn't exist yet, will be created by first migration
      console.log('Migrations table not found, will be created');
    }
    
    let newMigrationsCount = 0;
    
    for (const file of migrationFiles) {
      // Skip if migration already executed
      if (executedMigrations.includes(file)) {
        console.log(`⏭ Skipped (already executed): ${file}`);
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      
      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        
        // Record migration as executed
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        
        console.log(`✓ Completed: ${file}`);
        newMigrationsCount++;
      } catch (error) {
        if (error.code === '42710') { // Object already exists
          console.log(`⚠ Skipped (already exists): ${file}`);
          // Still record as executed to avoid future attempts
          try {
            await client.query('INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [file]);
          } catch (insertError) {
            // Ignore insert errors for already existing migrations
          }
        } else {
          console.log(`Migration failed: ${error.message}`);
          throw error;
        }
      }
    }
    
    client.release();
    console.log(`All migrations completed successfully! ${newMigrationsCount} new migrations executed.`);
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

