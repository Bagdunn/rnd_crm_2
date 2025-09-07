const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting R&D CRM application...');

// Wait a bit for database to be ready
console.log('⏳ Waiting for database connection...');
setTimeout(async () => {
  try {
    // Run migrations
    console.log('📊 Running database migrations...');
    execSync('node migrations/run-all-migrations.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });

    // Run seeds
    console.log('🌱 Running database seeds...');
    execSync('node seeds/run-seeds.js', { 
      stdio: 'inherit',
      cwd: __dirname 
    });

    console.log('✅ Database setup completed!');
    
    // Start the server
    console.log('🌐 Starting web server...');
    require('./server.js');
    
  } catch (error) {
    console.error('❌ Error during startup:', error.message);
    process.exit(1);
  }
}, 5000); // Wait 5 seconds for database
