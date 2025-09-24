const requiredEnvVars = {
  // Azure AD Configuration
  AZURE_TENANT_ID: 'Azure AD Tenant ID',
  AZURE_CLIENT_ID: 'Azure AD Client ID',
  AZURE_CLIENT_SECRET: 'Azure AD Client Secret',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'AWS Access Key ID',
  AWS_SECRET_ACCESS_KEY: 'AWS Secret Access Key',
  AWS_REGION: 'AWS Region',
  
  // MCP Gateway Configuration
  MCP_GATEWAY_URL: 'MCP Gateway URL',
  MCP_API_KEY: 'MCP API Key',
  
  // Application Configuration
  PORT: 'Server Port',
  NODE_ENV: 'Node Environment'
};

const optionalEnvVars = {
  AZURE_KEY_VAULT_URL: 'Azure Key Vault URL (optional)',
  BEDROCK_MODEL: 'Bedrock Model (optional)',
  BASE_URL: 'Base URL (optional)',
  TEAMS_APP_ID: 'Teams App ID (optional)'
};

function validateEnvironment() {
  const missing = [];
  const warnings = [];
  
  console.log('🔍 Validating environment configuration...');
  
  // Check required environment variables
  for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
      missing.push({ varName, description });
    } else {
      console.log(`✅ ${varName}: ${maskSensitiveValue(varName, process.env[varName])}`);
    }
  }
  
  // Check optional environment variables
  for (const [varName, description] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      warnings.push({ varName, description });
    } else {
      console.log(`✅ ${varName}: ${maskSensitiveValue(varName, process.env[varName])}`);
    }
  }
  
  // Report missing required variables
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(({ varName, description }) => {
      console.error(`   ${varName}: ${description}`);
    });
    return false;
  }
  
  // Report missing optional variables
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional environment variables:');
    warnings.forEach(({ varName, description }) => {
      console.warn(`   ${varName}: ${description}`);
    });
  }
  
  // Validate specific values
  const validationErrors = [];
  
  // Validate Azure Tenant ID format
  if (process.env.AZURE_TENANT_ID && !isValidGuid(process.env.AZURE_TENANT_ID)) {
    validationErrors.push('AZURE_TENANT_ID must be a valid GUID');
  }
  
  // Validate Azure Client ID format
  if (process.env.AZURE_CLIENT_ID && !isValidGuid(process.env.AZURE_CLIENT_ID)) {
    validationErrors.push('AZURE_CLIENT_ID must be a valid GUID');
  }
  
  // Validate AWS Region
  if (process.env.AWS_REGION && !isValidAWSRegion(process.env.AWS_REGION)) {
    validationErrors.push('AWS_REGION must be a valid AWS region');
  }
  
  // Validate URL format
  if (process.env.MCP_GATEWAY_URL && !isValidUrl(process.env.MCP_GATEWAY_URL)) {
    validationErrors.push('MCP_GATEWAY_URL must be a valid URL');
  }
  
  // Validate port number
  if (process.env.PORT && !isValidPort(process.env.PORT)) {
    validationErrors.push('PORT must be a valid port number (1-65535)');
  }
  
  if (validationErrors.length > 0) {
    console.error('❌ Environment validation errors:');
    validationErrors.forEach(error => console.error(`   ${error}`));
    return false;
  }
  
  console.log('✅ Environment validation passed');
  return true;
}

function maskSensitiveValue(varName, value) {
  const sensitiveVars = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN'];
  const isSensitive = sensitiveVars.some(sensitive => 
    varName.toUpperCase().includes(sensitive)
  );
  
  if (isSensitive && value) {
    return '*'.repeat(Math.min(value.length, 8));
  }
  
  return value;
}

function isValidGuid(value) {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(value);
}

function isValidAWSRegion(value) {
  const validRegions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1',
    'ap-northeast-2', 'ap-south-1', 'ca-central-1',
    'sa-east-1', 'af-south-1', 'ap-east-1', 'ap-northeast-3'
  ];
  return validRegions.includes(value);
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidPort(value) {
  const port = parseInt(value, 10);
  return port >= 1 && port <= 65535;
}

function getEnvironmentSummary() {
  const summary = {
    required: {},
    optional: {},
    missing: [],
    warnings: []
  };
  
  // Check required variables
  for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (process.env[varName]) {
      summary.required[varName] = maskSensitiveValue(varName, process.env[varName]);
    } else {
      summary.missing.push({ varName, description });
    }
  }
  
  // Check optional variables
  for (const [varName, description] of Object.entries(optionalEnvVars)) {
    if (process.env[varName]) {
      summary.optional[varName] = maskSensitiveValue(varName, process.env[varName]);
    } else {
      summary.warnings.push({ varName, description });
    }
  }
  
  return summary;
}

module.exports = {
  validateEnvironment,
  getEnvironmentSummary,
  requiredEnvVars,
  optionalEnvVars
};
