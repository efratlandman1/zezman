import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/v1';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/services`,
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

// Service API functions
export const serviceService = {
  // Get all services
  getServices: async (params = {}) => {
    try {
      const response = await api.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get service by ID
  getServiceById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services by category
  getServicesByCategory: async (categoryId, params = {}) => {
    try {
      const response = await api.get(`/category/${categoryId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new service (admin only)
  createService: async (serviceData) => {
    try {
      const response = await api.post('/', serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update service (admin only)
  updateService: async (id, serviceData) => {
    try {
      const response = await api.put(`/${id}`, serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete service (admin only)
  deleteService: async (id) => {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get service statistics
  getServiceStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get popular services
  getPopularServices: async (limit = 10) => {
    try {
      const response = await api.get('/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search services
  searchServices: async (query, params = {}) => {
    try {
      const response = await api.get('/search', { 
        params: { q: query, ...params } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services for business
  getBusinessServices: async (businessId) => {
    try {
      const response = await api.get(`/business/${businessId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default serviceService; 