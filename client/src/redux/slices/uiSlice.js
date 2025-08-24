import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Modal states
  modals: {
    login: false,
    register: false,
    businessForm: false,
    businessDetails: false,
    reviewForm: false,
    filterModal: false,
    locationPicker: false,
    imageUpload: false,
    confirmation: false,
    settings: false,
    help: false,
    about: false
  },
  
  // Notification states
  notifications: [],
  maxNotifications: 5,
  
  // Loading states
  loading: {
    global: false,
    auth: false,
    business: false,
    search: false,
    upload: false,
    review: false,
    favorite: false
  },
  
  // UI preferences
  preferences: {
    sidebarCollapsed: false,
    showFilters: true,
    showMap: false,
    compactView: false,
    autoRefresh: false,
    showTutorial: true,
    showWelcomeMessage: true
  },
  
  // Form states
  forms: {
    businessForm: {
      currentStep: 1,
      totalSteps: 3,
      isValid: false,
      isSubmitting: false,
      errors: {}
    },
    reviewForm: {
      isSubmitting: false,
      errors: {}
    },
    filterForm: {
      isExpanded: false,
      hasActiveFilters: false
    }
  },
  
  // Navigation states
  navigation: {
    currentRoute: '/',
    previousRoute: null,
    breadcrumbs: [],
    backButtonVisible: false
  },
  
  // Map states
  map: {
    center: { lat: 32.0853, lng: 34.7818 }, // Tel Aviv default
    zoom: 12,
    markers: [],
    selectedMarker: null,
    isFullscreen: false,
    showDirections: false
  },
  
  // Search UI states
  search: {
    isExpanded: false,
    showSuggestions: false,
    showFilters: false,
    showHistory: false,
    showPopular: false
  },
  
  // Responsive states
  responsive: {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    sidebarBreakpoint: 768,
    searchBreakpoint: 1024
  },
  
  // Error states
  errors: {
    global: null,
    network: null,
    validation: null,
    permission: null
  },
  
  // Success states
  success: {
    businessCreated: false,
    businessUpdated: false,
    reviewSubmitted: false,
    favoriteAdded: false,
    favoriteRemoved: false,
    profileUpdated: false
  },
  
  // Animation states
  animations: {
    pageTransition: false,
    modalTransition: false,
    listTransition: false,
    cardHover: false
  },
  
  // Accessibility states
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReader: false
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal management
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
    
    // Notification management
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      
      state.notifications.unshift(notification);
      
      // Keep only max notifications
      if (state.notifications.length > state.maxNotifications) {
        state.notifications = state.notifications.slice(0, state.maxNotifications);
      }
    },
    
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Loading state management
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (state.loading.hasOwnProperty(key)) {
        state.loading[key] = value;
      }
    },
    
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    // UI preferences management
    setPreference: (state, action) => {
      const { key, value } = action.payload;
      if (state.preferences.hasOwnProperty(key)) {
        state.preferences[key] = value;
        
        // Save to localStorage
        localStorage.setItem('uiPreferences', JSON.stringify(state.preferences));
      }
    },
    
    togglePreference: (state, action) => {
      const key = action.payload;
      if (state.preferences.hasOwnProperty(key)) {
        state.preferences[key] = !state.preferences[key];
        
        // Save to localStorage
        localStorage.setItem('uiPreferences', JSON.stringify(state.preferences));
      }
    },
    
    // Form state management
    setFormState: (state, action) => {
      const { formName, updates } = action.payload;
      if (state.forms.hasOwnProperty(formName)) {
        state.forms[formName] = { ...state.forms[formName], ...updates };
      }
    },
    
    setFormStep: (state, action) => {
      const { formName, step } = action.payload;
      if (state.forms.hasOwnProperty(formName)) {
        state.forms[formName].currentStep = step;
      }
    },
    
    setFormErrors: (state, action) => {
      const { formName, errors } = action.payload;
      if (state.forms.hasOwnProperty(formName)) {
        state.forms[formName].errors = errors;
      }
    },
    
    clearFormErrors: (state, action) => {
      const formName = action.payload;
      if (state.forms.hasOwnProperty(formName)) {
        state.forms[formName].errors = {};
      }
    },
    
    // Navigation state management
    setCurrentRoute: (state, action) => {
      state.navigation.previousRoute = state.navigation.currentRoute;
      state.navigation.currentRoute = action.payload;
    },
    
    setBreadcrumbs: (state, action) => {
      state.navigation.breadcrumbs = action.payload;
    },
    
    setBackButtonVisible: (state, action) => {
      state.navigation.backButtonVisible = action.payload;
    },
    
    // Map state management
    setMapCenter: (state, action) => {
      state.map.center = action.payload;
    },
    
    setMapZoom: (state, action) => {
      state.map.zoom = action.payload;
    },
    
    setMapMarkers: (state, action) => {
      state.map.markers = action.payload;
    },
    
    setSelectedMarker: (state, action) => {
      state.map.selectedMarker = action.payload;
    },
    
    toggleMapFullscreen: (state) => {
      state.map.isFullscreen = !state.map.isFullscreen;
    },
    
    toggleMapDirections: (state) => {
      state.map.showDirections = !state.map.showDirections;
    },
    
    // Search UI state management
    setSearchExpanded: (state, action) => {
      state.search.isExpanded = action.payload;
    },
    
    setSearchSuggestions: (state, action) => {
      state.search.showSuggestions = action.payload;
    },
    
    setSearchFilters: (state, action) => {
      state.search.showFilters = action.payload;
    },
    
    setSearchHistory: (state, action) => {
      state.search.showHistory = action.payload;
    },
    
    setSearchPopular: (state, action) => {
      state.search.showPopular = action.payload;
    },
    
    // Responsive state management
    setResponsiveState: (state, action) => {
      const { isMobile, isTablet, isDesktop } = action.payload;
      state.responsive.isMobile = isMobile;
      state.responsive.isTablet = isTablet;
      state.responsive.isDesktop = isDesktop;
    },
    
    // Error state management
    setError: (state, action) => {
      const { type, message } = action.payload;
      if (state.errors.hasOwnProperty(type)) {
        state.errors[type] = message;
      }
    },
    
    clearError: (state, action) => {
      const type = action.payload;
      if (state.errors.hasOwnProperty(type)) {
        state.errors[type] = null;
      }
    },
    
    clearAllErrors: (state) => {
      Object.keys(state.errors).forEach(key => {
        state.errors[key] = null;
      });
    },
    
    // Success state management
    setSuccess: (state, action) => {
      const { type, value } = action.payload;
      if (state.success.hasOwnProperty(type)) {
        state.success[type] = value;
      }
    },
    
    clearSuccess: (state, action) => {
      const type = action.payload;
      if (state.success.hasOwnProperty(type)) {
        state.success[type] = false;
      }
    },
    
    clearAllSuccess: (state) => {
      Object.keys(state.success).forEach(key => {
        state.success[key] = false;
      });
    },
    
    // Animation state management
    setAnimation: (state, action) => {
      const { type, value } = action.payload;
      if (state.animations.hasOwnProperty(type)) {
        state.animations[type] = value;
      }
    },
    
    // Accessibility state management
    setAccessibility: (state, action) => {
      const { type, value } = action.payload;
      if (state.accessibility.hasOwnProperty(type)) {
        state.accessibility[type] = value;
        
        // Save to localStorage
        localStorage.setItem('accessibilitySettings', JSON.stringify(state.accessibility));
      }
    },
    
    // Load preferences from localStorage
    loadPreferences: (state) => {
      try {
        const preferences = localStorage.getItem('uiPreferences');
        if (preferences) {
          state.preferences = { ...state.preferences, ...JSON.parse(preferences) };
        }
      } catch (error) {
        console.error('Failed to load UI preferences:', error);
      }
    },
    
    // Load accessibility settings from localStorage
    loadAccessibilitySettings: (state) => {
      try {
        const settings = localStorage.getItem('accessibilitySettings');
        if (settings) {
          state.accessibility = { ...state.accessibility, ...JSON.parse(settings) };
        }
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    },
    
    // Reset UI state
    resetUI: (state) => {
      return { ...initialState };
    }
  }
});

// Export actions
export const {
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  setGlobalLoading,
  setPreference,
  togglePreference,
  setFormState,
  setFormStep,
  setFormErrors,
  clearFormErrors,
  setCurrentRoute,
  setBreadcrumbs,
  setBackButtonVisible,
  setMapCenter,
  setMapZoom,
  setMapMarkers,
  setSelectedMarker,
  toggleMapFullscreen,
  toggleMapDirections,
  setSearchExpanded,
  setSearchSuggestions,
  setSearchFilters,
  setSearchHistory,
  setSearchPopular,
  setResponsiveState,
  setError,
  clearError,
  clearAllErrors,
  setSuccess,
  clearSuccess,
  clearAllSuccess,
  setAnimation,
  setAccessibility,
  loadPreferences,
  loadAccessibilitySettings,
  resetUI
} = uiSlice.actions;

// Export selectors
export const selectModals = (state) => state.ui.modals;
export const selectModalState = (state, modalName) => state.ui.modals[modalName];
export const selectNotifications = (state) => state.ui.notifications;
export const selectLoading = (state) => state.ui.loading;
export const selectGlobalLoading = (state) => state.ui.loading.global;
export const selectPreferences = (state) => state.ui.preferences;
export const selectForms = (state) => state.ui.forms;
export const selectFormState = (state, formName) => state.ui.forms[formName];
export const selectNavigation = (state) => state.ui.navigation;
export const selectMap = (state) => state.ui.map;
export const selectSearchUI = (state) => state.ui.search;
export const selectResponsive = (state) => state.ui.responsive;
export const selectErrors = (state) => state.ui.errors;
export const selectSuccess = (state) => state.ui.success;
export const selectAnimations = (state) => state.ui.animations;
export const selectAccessibility = (state) => state.ui.accessibility;

// Export reducer
export default uiSlice.reducer; 