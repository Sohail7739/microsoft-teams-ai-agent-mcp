const axios = require('axios');

let mcpConfig;

// Initialize MCP Gateway connection
async function initializeMCP() {
  try {
    mcpConfig = {
      baseUrl: process.env.MCP_GATEWAY_URL || 'https://mcp.topcoder.com',
      apiKey: process.env.MCP_API_KEY,
      environment: process.env.NODE_ENV || 'development'
    };

    if (!mcpConfig.apiKey) {
      throw new Error('MCP API key not found in environment variables');
    }

    // Test connection to MCP Gateway
    await testMCPConnection();
    
    console.log('✅ MCP Gateway initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MCP Gateway:', error);
    throw error;
  }
}

// Test MCP Gateway connection
async function testMCPConnection() {
  try {
    const response = await axios.get(`${mcpConfig.baseUrl}/health`, {
      headers: {
        'Authorization': `Bearer ${mcpConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`MCP Gateway health check failed: ${response.status}`);
    }

    console.log('✅ MCP Gateway connection verified');
  } catch (error) {
    console.error('❌ MCP Gateway connection test failed:', error);
    throw error;
  }
}

// Get available tools from MCP Gateway
async function getAvailableTools() {
  try {
    const response = await axios.get(`${mcpConfig.baseUrl}/tools`, {
      headers: {
        'Authorization': `Bearer ${mcpConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data.tools || [];
  } catch (error) {
    console.error('Error fetching available tools:', error);
    throw new Error('Failed to fetch available tools');
  }
}

// Execute a tool via MCP Gateway
async function executeTool(toolName, parameters = {}) {
  try {
    const response = await axios.post(`${mcpConfig.baseUrl}/execute`, {
      tool: toolName,
      parameters: parameters,
      environment: mcpConfig.environment
    }, {
      headers: {
        'Authorization': `Bearer ${mcpConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout for tool execution
    });

    return {
      success: true,
      result: response.data.result,
      metadata: response.data.metadata || {}
    };
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Tool execution failed',
        status: error.response.status
      };
    } else if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Tool execution timeout',
        status: 408
      };
    } else {
      return {
        success: false,
        error: 'Tool execution failed',
        status: 500
      };
    }
  }
}

// Get tool schema
async function getToolSchema(toolName) {
  try {
    const response = await axios.get(`${mcpConfig.baseUrl}/tools/${toolName}/schema`, {
      headers: {
        'Authorization': `Bearer ${mcpConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error(`Error getting tool schema for ${toolName}:`, error);
    throw new Error(`Failed to get schema for tool ${toolName}`);
  }
}

// Batch execute multiple tools
async function executeBatchTools(toolExecutions) {
  try {
    const response = await axios.post(`${mcpConfig.baseUrl}/execute/batch`, {
      executions: toolExecutions,
      environment: mcpConfig.environment
    }, {
      headers: {
        'Authorization': `Bearer ${mcpConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout for batch execution
    });

    return response.data;
  } catch (error) {
    console.error('Error executing batch tools:', error);
    throw new Error('Failed to execute batch tools');
  }
}

// Get execution history for a user
async function getExecutionHistory(userId, limit = 50) {
  try {
    const response = await axios.get(`${mcpConfig.baseUrl}/history`, {
      params: {
        userId,
        limit
      },
      headers: {
        'Authorization': `Bearer ${mcpConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data.history || [];
  } catch (error) {
    console.error('Error getting execution history:', error);
    throw new Error('Failed to get execution history');
  }
}

module.exports = {
  initializeMCP,
  getAvailableTools,
  executeTool,
  getToolSchema,
  executeBatchTools,
  getExecutionHistory,
  getMCPConfig: () => mcpConfig
};
