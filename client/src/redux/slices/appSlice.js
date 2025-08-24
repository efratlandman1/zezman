import { createSlice } from '@reduxjs/toolkit';

// Get initial language from localStorage or browser
const getInitialLanguage = () => {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) return savedLanguage;
  
  const browserLanguage = navigator.language || navigator.userLanguage;
  const isRTL = ['he', 'ar', 'fa', 'ur'].includes(browserLanguage.split('-')[0]);
  return isRTL ? 'he' : 'en';
};

// Get initial theme from localStorage or system preference
const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return savedTheme;
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

// Initial state
const initialState = {
  language: getInitialLanguage(),
  theme: getInitialTheme(),
  sidebarOpen: false,
  notifications: [],
  isLoading: false,
  error: null,
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
  recentBusinesses: JSON.parse(localStorage.getItem('recentBusinesses') || '[]'),
};

// App slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addToSearchHistory: (state, action) => {
      const searchTerm = action.payload;
      const existingIndex = state.searchHistory.indexOf(searchTerm);
      
      if (existingIndex > -1) {
        // Remove existing entry
        state.searchHistory.splice(existingIndex, 1);
      }
      
      // Add to beginning
      state.searchHistory.unshift(searchTerm);
      
      // Keep only last 10 searches
      if (state.searchHistory.length > 10) {
        state.searchHistory = state.searchHistory.slice(0, 10);
      }
      
      localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
      localStorage.removeItem('searchHistory');
    },
    addToRecentBusinesses: (state, action) => {
      const business = action.payload;
      const existingIndex = state.recentBusinesses.findIndex(
        b => b._id === business._id
      );
      
      if (existingIndex > -1) {
        // Remove existing entry
        state.recentBusinesses.splice(existingIndex, 1);
      }
      
      // Add to beginning
      state.recentBusinesses.unshift(business);
      
      // Keep only last 10 businesses
      if (state.recentBusinesses.length > 10) {
        state.recentBusinesses = state.recentBusinesses.slice(0, 10);
      }
      
      localStorage.setItem('recentBusinesses', JSON.stringify(state.recentBusinesses));
    },
    clearRecentBusinesses: (state) => {
      state.recentBusinesses = [];
      localStorage.removeItem('recentBusinesses');
    },
    resetApp: (state) => {
      state.sidebarOpen = false;
      state.notifications = [];
      state.isLoading = false;
      state.error = null;
    },
  },
});

// Export actions
export const {
  setLanguage,
  setTheme,
  toggleSidebar,
  openSidebar,
  closeSidebar,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setError,
  clearError,
  addToSearchHistory,
  clearSearchHistory,
  addToRecentBusinesses,
  clearRecentBusinesses,
  resetApp,
} = appSlice.actions;

// Export selectors
export const selectLanguage = (state) => state.app.language;
export const selectTheme = (state) => state.app.theme;
export const selectSidebarOpen = (state) => state.app.sidebarOpen;
export const selectNotifications = (state) => state.app.notifications;
export const selectIsLoading = (state) => state.app.isLoading;
export const selectError = (state) => state.app.error;
export const selectSearchHistory = (state) => state.app.searchHistory;
export const selectRecentBusinesses = (state) => state.app.recentBusinesses;

// Export reducer
export default appSlice.reducer; 