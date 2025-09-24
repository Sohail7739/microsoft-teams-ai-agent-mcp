const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting production deployment...');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.error('❌ .env file not found. Please create one from env.example');
  process.exit(1);
}

// Check if required environment variables are set
const requiredVars = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID', 
  'AZURE_CLIENT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'MCP_GATEWAY_URL',
  'MCP_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please set these variables in your .env file');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm run install:all', { stdio: 'inherit' });
  
  console.log('🔨 Building React application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('📋 Building Teams manifest...');
  execSync('npm run build:manifest', { stdio: 'inherit' });
  
  console.log('✅ Production build completed successfully!');
  console.log('');
  console.log('📁 Build artifacts:');
  console.log('   - client/build/ (React app)');
  console.log('   - teams-app-manifest-built.json (Teams manifest)');
  console.log('   - icons/ (Teams app icons)');
  console.log('');
  console.log('🚀 Ready for deployment!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy to your hosting platform (Azure App Service, AWS, etc.)');
  console.log('2. Update the Teams manifest with your actual URLs');
  console.log('3. Upload the Teams app package to Microsoft Teams');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
