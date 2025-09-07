#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting R&D CRM application...');

// Wait for database connection
console.log('⏳ Waiting for database connection...');
setTimeout(() => {
  try {
    // Run migrations
    console.log('📊 Running database migrations...');
    execSync('node migrations/run-all-migrations.js', { stdio: 'inherit' });
    
    // Run seeds
    console.log('🌱 Running database seeds...');
    execSync('node seeds/run-seeds.js', { stdio: 'inherit' });
    
    console.log('✅ Database setup completed!');
    
    // Start server
    console.log('🌐 Starting web server...');
    execSync('node server.js', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}, 10000); // Wait 10 seconds for database
