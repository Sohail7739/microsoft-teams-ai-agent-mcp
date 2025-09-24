const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  getAvailableTools, 
  executeTool, 
  getToolSchema, 
  executeBatchTools, 
  getExecutionHistory 
} = require('../services/mcp');

const router = express.Router();

// Get available tools
router.get('/tools', authenticateToken, async (req, res) => {
  try {
    const tools = await getAvailableTools();
    
    res.json({
      success: true,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        category: tool.category || 'general'
      }))
    });
  } catch (error) {
    console.error('Error getting available tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available tools'
    });
  }
});

// Get tool schema
router.get('/tools/:toolName/schema', authenticateToken, async (req, res) => {
  try {
    const { toolName } = req.params;
    const schema = await getToolSchema(toolName);
    
    res.json({
      success: true,
      schema
    });
  } catch (error) {
    console.error(`Error getting schema for tool ${toolName}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to get schema for tool ${toolName}`
    });
  }
});

// Execute a single tool
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const { tool, parameters = {} } = req.body;
    
    if (!tool) {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required'
      });
    }

    const result = await executeTool(tool, parameters);
    
    res.json({
      success: true,
      tool,
      parameters,
      result
    });
  } catch (error) {
    console.error('Error executing tool:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute tool'
    });
  }
});

// Execute multiple tools in batch
router.post('/execute/batch', authenticateToken, async (req, res) => {
  try {
    const { executions } = req.body;
    
    if (!Array.isArray(executions) || executions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Executions array is required'
      });
    }

    const results = await executeBatchTools(executions);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error executing batch tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute batch tools'
    });
  }
});

// Get execution history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const history = await getExecutionHistory(userId, parseInt(limit));
    
    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error getting execution history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get execution history'
    });
  }
});

// Test tool connection
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { tool, parameters = {} } = req.body;
    
    if (!tool) {
      return res.status(400).json({
        success: false,
        error: 'Tool name is required'
      });
    }

    // Execute with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tool execution timeout')), 10000);
    });

    const executionPromise = executeTool(tool, parameters);
    
    const result = await Promise.race([executionPromise, timeoutPromise]);
    
    res.json({
      success: true,
      tool,
      result,
      message: 'Tool test completed successfully'
    });
  } catch (error) {
    console.error('Error testing tool:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Tool test failed'
    });
  }
});

// Get tool categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const tools = await getAvailableTools();
    const categories = [...new Set(tools.map(tool => tool.category || 'general'))];
    
    res.json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    console.error('Error getting tool categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tool categories'
    });
  }
});

module.exports = router;
