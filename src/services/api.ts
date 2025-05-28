import axios from 'axios';
import { config } from '../config';
import { acquireToken } from './authService';

const api = axios.create({
    baseURL: config.apiConfig.baseUrl,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // Add request interceptor to include auth token
  api.interceptors.request.use(async (config) => {
    try {
      const token = await acquireToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error getting token:', error);
      return Promise.reject(error);
    }
  });
  
  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // Handle specific error status codes
        switch (error.response.status) {
          case 401:
            // Unauthorized - redirect to login
            window.location.href = '/login';
            break;
          case 403:
            // Forbidden
            console.error('Access forbidden:', error.response.data);
            break;
          default:
            console.error('API Error:', error.response.data);
        }
      } else if (error.request) {
        // Request made but no response received
        console.error('No response received:', error.request);
      } else {
        // Error setting up request
        console.error('Request error:', error.message);
      }
      return Promise.reject(error);
    }
  );
  
  export default api;