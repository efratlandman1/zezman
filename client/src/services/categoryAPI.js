import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/v1';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/categories`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Category API functions
export const categoryService = {
  // Get all categories
  getCategories: async (params = {}) => {
    try {
      const response = await api.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new category (admin only)
  createCategory: async (categoryData) => {
    try {
      const response = await api.post('/', categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update category (admin only)
  updateCategory: async (id, categoryData) => {
    try {
      const response = await api.put(`/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete category (admin only)
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get category statistics
  getCategoryStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get popular categories
  getPopularCategories: async (limit = 10) => {
    try {
      const response = await api.get('/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search categories
  searchCategories: async (query, params = {}) => {
    try {
      const response = await api.get('/search', { 
        params: { q: query, ...params } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default categoryService; 