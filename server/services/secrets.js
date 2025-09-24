const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

let secretClient;
let isInitialized = false;

// Initialize Azure Key Vault client
async function initializeSecrets() {
  try {
    const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
    
    if (!keyVaultUrl) {
      console.warn('⚠️  Azure Key Vault URL not provided, using environment variables');
      return;
    }

    // Use DefaultAzureCredential for authentication
    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(keyVaultUrl, credential);

    // Test connection
    await secretClient.getSecret('test-connection');
    isInitialized = true;
    
    console.log('✅ Azure Key Vault initialized successfully');
  } catch (error) {
    console.warn('⚠️  Azure Key Vault not available, using environment variables:', error.message);
    isInitialized = false;
  }
}

// Get secret from Key Vault or environment
async function getSecret(secretName, defaultValue = null) {
  try {
    if (isInitialized && secretClient) {
      const secret = await secretClient.getSecret(secretName);
      return secret.value;
    } else {
      // Fallback to environment variables
      const envValue = process.env[secretName];
      if (envValue) {
        return envValue;
      }
      
      if (defaultValue !== null) {
        return defaultValue;
      }
      
      throw new Error(`Secret ${secretName} not found in Key Vault or environment variables`);
    }
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    throw error;
  }
}

// Get multiple secrets
async function getSecrets(secretNames) {
  try {
    const secrets = {};
    
    for (const secretName of secretNames) {
      try {
        secrets[secretName] = await getSecret(secretName);
      } catch (error) {
        console.warn(`Failed to get secret ${secretName}:`, error.message);
        secrets[secretName] = null;
      }
    }
    
    return secrets;
  } catch (error) {
    console.error('Error getting multiple secrets:', error);
    throw error;
  }
}

// Set secret in Key Vault
async function setSecret(secretName, secretValue) {
  try {
    if (isInitialized && secretClient) {
      await secretClient.setSecret(secretName, secretValue);
      console.log(`✅ Secret ${secretName} set successfully`);
    } else {
      console.warn('⚠️  Key Vault not available, cannot set secret');
      throw new Error('Key Vault not available');
    }
  } catch (error) {
    console.error(`Error setting secret ${secretName}:`, error);
    throw error;
  }
}

// Delete secret from Key Vault
async function deleteSecret(secretName) {
  try {
    if (isInitialized && secretClient) {
      await secretClient.beginDeleteSecret(secretName);
      console.log(`✅ Secret ${secretName} deleted successfully`);
    } else {
      console.warn('⚠️  Key Vault not available, cannot delete secret');
      throw new Error('Key Vault not available');
    }
  } catch (error) {
    console.error(`Error deleting secret ${secretName}:`, error);
    throw error;
  }
}

// Get all required secrets for the application
async function getApplicationSecrets() {
  const requiredSecrets = [
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'MCP_GATEWAY_URL',
    'MCP_API_KEY',
    'BEDROCK_MODEL'
  ];

  try {
    const secrets = await getSecrets(requiredSecrets);
    
    // Set environment variables from secrets
    Object.entries(secrets).forEach(([key, value]) => {
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    });

    return secrets;
  } catch (error) {
    console.error('Error getting application secrets:', error);
    throw error;
  }
}

module.exports = {
  initializeSecrets,
  getSecret,
  getSecrets,
  setSecret,
  deleteSecret,
  getApplicationSecrets
};
