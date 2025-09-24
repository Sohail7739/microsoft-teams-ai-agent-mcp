const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { generateResponse, generateResponseWithTools, parseToolSelection } = require('../services/bedrock');
const { getAvailableTools, executeTool } = require('../services/mcp');

const router = express.Router();

// Store conversation history per user
const conversationHistory = new Map();

// Get conversation history for a user
router.get('/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const userHistory = conversationHistory.get(userId) || [];
    
    res.json({
      success: true,
      history: userHistory
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history'
    });
  }
});

// Clear conversation history for a user
router.delete('/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    conversationHistory.delete(userId);
    
    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation history'
    });
  }
});

// Chat with AI agent
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, userId, includeTools = true } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Message and userId are required'
      });
    }

    // Get user's conversation history
    const userHistory = conversationHistory.get(userId) || [];
    
    // Add user message to history
    userHistory.push({
      type: 'user',
      message,
      timestamp: new Date().toISOString()
    });

    // Get available tools if requested
    let availableTools = [];
    if (includeTools) {
      try {
        availableTools = await getAvailableTools();
      } catch (error) {
        console.warn('Failed to get available tools:', error);
      }
    }

    // Build context from conversation history
    const context = {
      userId,
      history: userHistory.slice(-10), // Last 10 messages for context
      availableTools: availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
    };

    // Generate AI response
    let aiResponse = '';
    let toolSelection = null;
    
    if (includeTools && availableTools.length > 0) {
      // Generate response with tool selection
      const responseStream = await generateResponseWithTools(message, availableTools, context);
      
      for await (const chunk of responseStream) {
        aiResponse += chunk;
        
        // Check for tool selection in the response
        if (!toolSelection) {
          toolSelection = parseToolSelection(aiResponse);
        }
      }
    } else {
      // Generate regular response
      const responseStream = await generateResponse(message, context);
      
      for await (const chunk of responseStream) {
        aiResponse += chunk;
      }
    }

    // Execute tool if selected
    let toolResult = null;
    if (toolSelection && toolSelection.tool) {
      try {
        const executionResult = await executeTool(toolSelection.tool, toolSelection.parameters || {});
        toolResult = {
          tool: toolSelection.tool,
          parameters: toolSelection.parameters,
          result: executionResult
        };
      } catch (error) {
        console.error('Tool execution error:', error);
        toolResult = {
          tool: toolSelection.tool,
          parameters: toolSelection.parameters,
          result: {
            success: false,
            error: 'Tool execution failed'
          }
        };
      }
    }

    // Add AI response to history
    const aiMessage = {
      type: 'assistant',
      message: aiResponse,
      toolResult,
      timestamp: new Date().toISOString()
    };
    
    userHistory.push(aiMessage);
    conversationHistory.set(userId, userHistory);

    res.json({
      success: true,
      response: aiResponse,
      toolResult,
      timestamp: aiMessage.timestamp
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request'
    });
  }
});

// Stream chat response
router.post('/chat/stream', authenticateToken, async (req, res) => {
  try {
    const { message, userId, includeTools = true } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Message and userId are required'
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Get user's conversation history
    const userHistory = conversationHistory.get(userId) || [];
    
    // Add user message to history
    userHistory.push({
      type: 'user',
      message,
      timestamp: new Date().toISOString()
    });

    // Get available tools if requested
    let availableTools = [];
    if (includeTools) {
      try {
        availableTools = await getAvailableTools();
      } catch (error) {
        console.warn('Failed to get available tools:', error);
      }
    }

    // Build context from conversation history
    const context = {
      userId,
      history: userHistory.slice(-10),
      availableTools: availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
    };

    let aiResponse = '';
    let toolSelection = null;

    try {
      // Generate streaming response
      let responseStream;
      if (includeTools && availableTools.length > 0) {
        responseStream = await generateResponseWithTools(message, availableTools, context);
      } else {
        responseStream = await generateResponse(message, context);
      }

      for await (const chunk of responseStream) {
        aiResponse += chunk;
        
        // Check for tool selection
        if (!toolSelection) {
          toolSelection = parseToolSelection(aiResponse);
        }
        
        // Send chunk to client
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: chunk
        })}\n\n`);
      }

      // Execute tool if selected
      if (toolSelection && toolSelection.tool) {
        res.write(`data: ${JSON.stringify({
          type: 'tool_invocation',
          tool: toolSelection.tool,
          parameters: toolSelection.parameters
        })}\n\n`);

        try {
          const executionResult = await executeTool(toolSelection.tool, toolSelection.parameters || {});
          
          res.write(`data: ${JSON.stringify({
            type: 'tool_result',
            tool: toolSelection.tool,
            result: executionResult
          })}\n\n`);
        } catch (error) {
          res.write(`data: ${JSON.stringify({
            type: 'tool_error',
            tool: toolSelection.tool,
            error: 'Tool execution failed'
          })}\n\n`);
        }
      }

      // Add AI response to history
      const aiMessage = {
        type: 'assistant',
        message: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      userHistory.push(aiMessage);
      conversationHistory.set(userId, userHistory);

      // Send completion signal
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        timestamp: aiMessage.timestamp
      })}\n\n`);

    } catch (error) {
      console.error('Error in streaming chat:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Failed to generate response'
      })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('Error in stream chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process streaming chat request'
    });
  }
});

module.exports = router;
