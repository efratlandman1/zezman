import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/v1';

// Create axios instance with default config
const businessAPI = axios.create({
  baseURL: `${API_BASE_URL}/businesses`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
businessAPI.interceptors.request.use(
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
businessAPI.interceptors.response.use(
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

// Business API methods
export const businessService = {
  // Get all businesses with pagination and filters
  getAllBusinesses: async (params = {}) => {
    const response = await businessAPI.get('/', { params });
    return response;
  },

  // Search businesses
  searchBusinesses: async (searchParams) => {
    const response = await businessAPI.get('/search', { params: searchParams });
    return response;
  },

  // Get business by ID
  getBusinessById: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}`);
    return response;
  },

  // Create new business
  createBusiness: async (businessData) => {
    const response = await businessAPI.post('/', businessData);
    return response;
  },

  // Update business
  updateBusiness: async (businessId, businessData) => {
    const response = await businessAPI.put(`/${businessId}`, businessData);
    return response;
  },

  // Delete business
  deleteBusiness: async (businessId) => {
    const response = await businessAPI.delete(`/${businessId}`);
    return response;
  },

  // Get user's businesses
  getUserBusinesses: async (params = {}) => {
    const response = await businessAPI.get('/my-businesses', { params });
    return response;
  },

  // Get featured businesses
  getFeaturedBusinesses: async (params = {}) => {
    const response = await businessAPI.get('/featured', { params });
    return response;
  },

  // Get nearby businesses
  getNearbyBusinesses: async (params) => {
    const response = await businessAPI.get('/nearby', { params });
    return response;
  },

  // Get business statistics
  getBusinessStats: async () => {
    const response = await businessAPI.get('/stats');
    return response;
  },

  // Upload business images
  uploadBusinessImages: async (businessId, formData) => {
    const response = await businessAPI.post(`/${businessId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Delete business image
  deleteBusinessImage: async (businessId, imageId) => {
    const response = await businessAPI.delete(`/${businessId}/images/${imageId}`);
    return response;
  },

  // Update business images order
  updateImagesOrder: async (businessId, imageOrder) => {
    const response = await businessAPI.put(`/${businessId}/images/order`, { imageOrder });
    return response;
  },

  // Get business reviews
  getBusinessReviews: async (businessId, params = {}) => {
    const response = await businessAPI.get(`/${businessId}/reviews`, { params });
    return response;
  },

  // Add business review
  addBusinessReview: async (businessId, reviewData) => {
    const response = await businessAPI.post(`/${businessId}/reviews`, reviewData);
    return response;
  },

  // Update business review
  updateBusinessReview: async (businessId, reviewId, reviewData) => {
    const response = await businessAPI.put(`/${businessId}/reviews/${reviewId}`, reviewData);
    return response;
  },

  // Delete business review
  deleteBusinessReview: async (businessId, reviewId) => {
    const response = await businessAPI.delete(`/${businessId}/reviews/${reviewId}`);
    return response;
  },

  // Get business favorites
  getBusinessFavorites: async (businessId, params = {}) => {
    const response = await businessAPI.get(`/${businessId}/favorites`, { params });
    return response;
  },

  // Add business to favorites
  addToFavorites: async (businessId) => {
    const response = await businessAPI.post(`/${businessId}/favorites`);
    return response;
  },

  // Remove business from favorites
  removeFromFavorites: async (businessId) => {
    const response = await businessAPI.delete(`/${businessId}/favorites`);
    return response;
  },

  // Check if business is favorited
  checkIfFavorited: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}/favorites/check`);
    return response;
  },

  // Get business services
  getBusinessServices: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}/services`);
    return response;
  },

  // Update business services
  updateBusinessServices: async (businessId, services) => {
    const response = await businessAPI.put(`/${businessId}/services`, { services });
    return response;
  },

  // Get business hours
  getBusinessHours: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}/hours`);
    return response;
  },

  // Update business hours
  updateBusinessHours: async (businessId, hours) => {
    const response = await businessAPI.put(`/${businessId}/hours`, { hours });
    return response;
  },

  // Get business analytics
  getBusinessAnalytics: async (businessId, params = {}) => {
    const response = await businessAPI.get(`/${businessId}/analytics`, { params });
    return response;
  },

  // Get business insights
  getBusinessInsights: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}/insights`);
    return response;
  },

  // Update business status
  updateBusinessStatus: async (businessId, status) => {
    const response = await businessAPI.patch(`/${businessId}/status`, { status });
    return response;
  },

  // Request business verification
  requestVerification: async (businessId, verificationData) => {
    const response = await businessAPI.post(`/${businessId}/verification`, verificationData);
    return response;
  },

  // Get business suggestions
  getBusinessSuggestions: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}/suggestions`);
    return response;
  },

  // Submit business suggestion
  submitBusinessSuggestion: async (suggestionData) => {
    const response = await businessAPI.post('/suggestions', suggestionData);
    return response;
  },

  // Get business categories
  getBusinessCategories: async () => {
    const response = await businessAPI.get('/categories');
    return response;
  },

  // Get business services list
  getBusinessServicesList: async (categoryId = null) => {
    const params = categoryId ? { categoryId } : {};
    const response = await businessAPI.get('/services', { params });
    return response;
  },

  // Get popular businesses
  getPopularBusinesses: async (params = {}) => {
    const response = await businessAPI.get('/popular', { params });
    return response;
  },

  // Get trending businesses
  getTrendingBusinesses: async (params = {}) => {
    const response = await businessAPI.get('/trending', { params });
    return response;
  },

  // Get new businesses
  getNewBusinesses: async (params = {}) => {
    const response = await businessAPI.get('/new', { params });
    return response;
  },

  // Get verified businesses
  getVerifiedBusinesses: async (params = {}) => {
    const response = await businessAPI.get('/verified', { params });
    return response;
  },

  // Get businesses by category
  getBusinessesByCategory: async (categoryId, params = {}) => {
    const response = await businessAPI.get(`/category/${categoryId}`, { params });
    return response;
  },

  // Get businesses by service
  getBusinessesByService: async (serviceId, params = {}) => {
    const response = await businessAPI.get(`/service/${serviceId}`, { params });
    return response;
  },

  // Get businesses by location
  getBusinessesByLocation: async (location, params = {}) => {
    const response = await businessAPI.get(`/location/${encodeURIComponent(location)}`, { params });
    return response;
  },

  // Get businesses by city
  getBusinessesByCity: async (city, params = {}) => {
    const response = await businessAPI.get(`/city/${encodeURIComponent(city)}`, { params });
    return response;
  },

  // Get business recommendations
  getBusinessRecommendations: async (businessId = null, params = {}) => {
    const url = businessId ? `/recommendations/${businessId}` : '/recommendations';
    const response = await businessAPI.get(url, { params });
    return response;
  },

  // Report business
  reportBusiness: async (businessId, reportData) => {
    const response = await businessAPI.post(`/${businessId}/report`, reportData);
    return response;
  },

  // Share business
  shareBusiness: async (businessId, shareData) => {
    const response = await businessAPI.post(`/${businessId}/share`, shareData);
    return response;
  },

  // Get business QR code
  getBusinessQRCode: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}/qr-code`);
    return response;
  },

  // Get business embed code
  getBusinessEmbedCode: async (businessId) => {
    const response = await businessAPI.get(`/${businessId}/embed`);
    return response;
  },

  // Export business data
  exportBusinessData: async (businessId, format = 'json') => {
    const response = await businessAPI.get(`/${businessId}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response;
  },

  // Import business data
  importBusinessData: async (formData) => {
    const response = await businessAPI.post('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Create review
  createReview: async (reviewData) => {
    const response = await businessAPI.post('/reviews', reviewData);
    return response;
  },

  // Get user favorites
  getUserFavorites: async (params = {}) => {
    const response = await businessAPI.get('/favorites', { params });
    return response;
  },

  // Get user reviews
  getUserReviews: async (params = {}) => {
    const response = await businessAPI.get('/reviews', { params });
    return response;
  }
};

// Export the service
export default businessService; 