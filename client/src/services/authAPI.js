import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/v1';

// Create axios instance with default config
const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
authAPI.interceptors.request.use(
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

// Response interceptor to handle token refresh
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await authAPI.post('/refresh-token', {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem('token', token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return authAPI(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API methods
export const authService = {
  // User registration
  register: async (userData) => {
    const response = await authAPI.post('/register', userData);
    return response;
  },

  // User login
  login: async (credentials) => {
    const response = await authAPI.post('/login', credentials);
    return response;
  },

  // Google OAuth login
  googleLogin: async (tokenId) => {
    const response = await authAPI.post('/google', { tokenId });
    return response;
  },

  // Google OAuth login (alias for loginWithGoogle)
  loginWithGoogle: async () => {
    const response = await authAPI.post('/google/login');
    return response;
  },

  // Google OAuth registration
  registerWithGoogle: async () => {
    const response = await authAPI.post('/google/register');
    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await authAPI.get('/me');
    return response;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await authAPI.put('/profile', userData);
    return response;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await authAPI.put('/change-password', passwordData);
    return response;
  },

  // Request password reset
  forgotPassword: async (email) => {
    const response = await authAPI.post('/forgot-password', { email });
    return response;
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await authAPI.post('/reset-password', resetData);
    return response;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await authAPI.post('/verify-email', { token });
    return response;
  },

  // Request email verification
  requestEmailVerification: async () => {
    const response = await authAPI.post('/request-email-verification');
    return response;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await authAPI.post('/refresh-token', { refreshToken });
    return response;
  },

  // Logout
  logout: async () => {
    const response = await authAPI.post('/logout');
    return response;
  },

  // Check if user is authenticated
  checkAuth: async () => {
    try {
      const response = await authAPI.get('/me');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user preferences
  getUserPreferences: async () => {
    const response = await authAPI.get('/preferences');
    return response;
  },

  // Update user preferences
  updateUserPreferences: async (preferences) => {
    const response = await authAPI.put('/preferences', preferences);
    return response;
  },

  // Delete account
  deleteAccount: async (password) => {
    const response = await authAPI.delete('/account', { data: { password } });
    return response;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await authAPI.get('/stats');
    return response;
  },

  // Get user activity
  getUserActivity: async (params = {}) => {
    const response = await authAPI.get('/activity', { params });
    return response;
  },

  // Update user avatar
  updateAvatar: async (formData) => {
    const response = await authAPI.put('/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Remove user avatar
  removeAvatar: async () => {
    const response = await authAPI.delete('/avatar');
    return response;
  },

  // Get user notifications
  getNotifications: async (params = {}) => {
    const response = await authAPI.get('/notifications', { params });
    return response;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    const response = await authAPI.put(`/notifications/${notificationId}/read`);
    return response;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    const response = await authAPI.put('/notifications/read-all');
    return response;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await authAPI.delete(`/notifications/${notificationId}`);
    return response;
  },

  // Get user sessions
  getUserSessions: async () => {
    const response = await authAPI.get('/sessions');
    return response;
  },

  // Revoke session
  revokeSession: async (sessionId) => {
    const response = await authAPI.delete(`/sessions/${sessionId}`);
    return response;
  },

  // Revoke all sessions
  revokeAllSessions: async () => {
    const response = await authAPI.delete('/sessions');
    return response;
  },

  // Enable two-factor authentication
  enable2FA: async () => {
    const response = await authAPI.post('/2fa/enable');
    return response;
  },

  // Disable two-factor authentication
  disable2FA: async (code) => {
    const response = await authAPI.post('/2fa/disable', { code });
    return response;
  },

  // Verify two-factor authentication
  verify2FA: async (code) => {
    const response = await authAPI.post('/2fa/verify', { code });
    return response;
  },

  // Get backup codes
  getBackupCodes: async () => {
    const response = await authAPI.get('/2fa/backup-codes');
    return response;
  },

  // Generate new backup codes
  generateBackupCodes: async () => {
    const response = await authAPI.post('/2fa/backup-codes');
    return response;
  }
};

// Export the service
export default authService; 