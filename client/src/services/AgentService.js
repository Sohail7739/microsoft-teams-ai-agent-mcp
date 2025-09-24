import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class AgentService {
  async sendMessage(message, userId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/agent/chat`, {
        message,
        userId,
        includeTools: true
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to send message');
    }
  }

  async sendMessageStream(message, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/agent/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          message,
          userId,
          includeTools: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Failed to send streaming message:', error);
      throw new Error('Failed to send streaming message');
    }
  }

  async getHistory(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/agent/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get history:', error);
      throw new Error('Failed to get history');
    }
  }

  async clearHistory(userId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/agent/history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw new Error('Failed to clear history');
    }
  }

  async getAvailableTools() {
    try {
      const response = await axios.get(`${API_BASE_URL}/mcp/tools`);
      return response.data;
    } catch (error) {
      console.error('Failed to get available tools:', error);
      throw new Error('Failed to get available tools');
    }
  }

  async executeTool(tool, parameters = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/mcp/execute`, {
        tool,
        parameters
      });
      return response.data;
    } catch (error) {
      console.error('Failed to execute tool:', error);
      throw new Error('Failed to execute tool');
    }
  }

  async getToolSchema(toolName) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mcp/tools/${toolName}/schema`);
      return response.data;
    } catch (error) {
      console.error('Failed to get tool schema:', error);
      throw new Error('Failed to get tool schema');
    }
  }

  async testTool(tool, parameters = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/mcp/test`, {
        tool,
        parameters
      });
      return response.data;
    } catch (error) {
      console.error('Failed to test tool:', error);
      throw new Error('Failed to test tool');
    }
  }

  async getExecutionHistory(userId, limit = 50) {
    try {
      const response = await axios.get(`${API_BASE_URL}/mcp/history`, {
        params: { userId, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get execution history:', error);
      throw new Error('Failed to get execution history');
    }
  }

  async getToolCategories() {
    try {
      const response = await axios.get(`${API_BASE_URL}/mcp/categories`);
      return response.data;
    } catch (error) {
      console.error('Failed to get tool categories:', error);
      throw new Error('Failed to get tool categories');
    }
  }
}

export default new AgentService();
