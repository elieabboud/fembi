import axios from 'axios';
import { acquireToken } from './authService';

const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL || "https://localhost:44349",
    headers: {
      'Content-Type': 'application/json'
    }
  });

// Update baseURL after runtime config loads
const updateBaseURL = async () => {
  try {
    const response = await fetch('/.env');
    const envContent = await response.text();
    
    for (const line of envContent.split('\n')) {
      if (line.startsWith('REACT_APP_BACKEND_URL=')) {
        const value = line.split('=')[1]?.trim();
        if (value) {
          api.defaults.baseURL = value;
          break;
        }
      }
    }
  } catch (error) {
    console.warn('Could not load runtime .env file:', error);
  }
};

// Call this when your app initializes
updateBaseURL();
  
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