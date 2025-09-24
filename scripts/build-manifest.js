const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

function buildManifest() {
  try {
    console.log('🔧 Building Teams app manifest...');
    
    // Read the template manifest
    const manifestPath = path.join(__dirname, '../teams-app-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Configuration from environment variables
    const config = {
      APP_ID: process.env.TEAMS_APP_ID || process.env.AZURE_CLIENT_ID || 'your-app-id',
      BASE_URL: process.env.BASE_URL || 'https://your-domain.com',
      BASE_URL_DOMAIN: process.env.BASE_URL_DOMAIN || new URL(process.env.BASE_URL || 'https://your-domain.com').hostname
    };
    
    console.log('📋 Configuration:');
    console.log(`   APP_ID: ${config.APP_ID}`);
    console.log(`   BASE_URL: ${config.BASE_URL}`);
    console.log(`   BASE_URL_DOMAIN: ${config.BASE_URL_DOMAIN}`);
    
    // Replace placeholders in manifest
    const manifestStr = JSON.stringify(manifest, null, 2)
      .replace(/\{\{APP_ID\}\}/g, config.APP_ID)
      .replace(/\{\{BASE_URL\}\}/g, config.BASE_URL)
      .replace(/\{\{BASE_URL_DOMAIN\}\}/g, config.BASE_URL_DOMAIN);
    
    // Write the built manifest
    const builtManifestPath = path.join(__dirname, '../teams-app-manifest-built.json');
    fs.writeFileSync(builtManifestPath, manifestStr);
    
    console.log('✅ Manifest built successfully: teams-app-manifest-built.json');
    console.log('📦 Ready for Teams app deployment');
    
    return true;
  } catch (error) {
    console.error('❌ Error building manifest:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  buildManifest();
}

module.exports = { buildManifest };
