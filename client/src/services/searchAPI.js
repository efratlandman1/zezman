import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/v1';

// Create axios instance with default config
const searchAPI = axios.create({
  baseURL: `${API_BASE_URL}/businesses`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
searchAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
searchAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Search API methods
export const searchService = {
  // Search businesses
  searchBusinesses: async (searchParams) => {
    const response = await searchAPI.get('/search', { params: searchParams });
    return response;
  },

  // Get featured businesses
  getFeaturedBusinesses: async (params = {}) => {
    const response = await searchAPI.get('/featured', { params });
    return response;
  },

  // Get nearby businesses
  getNearbyBusinesses: async (params) => {
    const response = await searchAPI.get('/nearby', { params });
    return response;
  }
};

// Export the service
export default searchService; 