import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class AuthService {
  constructor() {
    this.authToken = null;
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth();
          // Redirect to login or show auth error
          window.location.reload();
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  getAuthToken() {
    return this.authToken || localStorage.getItem('authToken');
  }

  clearAuth() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  async validateToken(token) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/validate`, {
        token
      });
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error('Token validation failed');
    }
  }

  async getUserInfo() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/user`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('Failed to get user info');
    }
  }

  async getTeamsContext() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/context`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Teams context:', error);
      throw new Error('Failed to get Teams context');
    }
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }
}

export default new AuthService();
