import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import searchService from '../../services/searchAPI';

// Async thunks
export const searchBusinesses = createAsyncThunk(
  'search/searchBusinesses',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await searchService.searchBusinesses(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Search failed' });
    }
  }
);

export const getSearchSuggestions = createAsyncThunk(
  'search/getSearchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      const response = await searchService.getSearchSuggestions(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to get suggestions' });
    }
  }
);

export const getPopularSearches = createAsyncThunk(
  'search/getPopularSearches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await searchService.getPopularSearches();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to get popular searches' });
    }
  }
);

const initialState = {
  // Search results
  results: [],
  totalResults: 0,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
  
  // Search state
  isLoading: false,
  isSearching: false,
  error: null,
  
  // Search parameters
  query: '',
  filters: {
    category: '',
    location: '',
    rating: null,
    priceRange: '',
    services: [],
    distance: null,
    sortBy: 'relevance',
    openNow: false,
    verified: false,
    featured: false
  },
  
  // Search history
  searchHistory: [],
  maxHistoryItems: 10,
  
  // Suggestions
  suggestions: [],
  popularSearches: [],
  
  // Recent searches
  recentSearches: [],
  maxRecentItems: 5,
  
  // Search analytics
  searchStats: {
    totalSearches: 0,
    averageResults: 0,
    mostSearchedCategories: [],
    mostSearchedLocations: []
  }
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Search state management
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    resetSearch: (state) => {
      state.results = [];
      state.totalResults = 0;
      state.currentPage = 1;
      state.totalPages = 1;
      state.hasMore = false;
      state.error = null;
    },
    
    // Search history management
    addToSearchHistory: (state, action) => {
      const searchItem = {
        query: action.payload.query,
        filters: action.payload.filters,
        timestamp: new Date().toISOString(),
        resultsCount: action.payload.resultsCount || 0
      };
      
      // Remove duplicate if exists
      state.searchHistory = state.searchHistory.filter(
        item => item.query !== searchItem.query
      );
      
      // Add to beginning
      state.searchHistory.unshift(searchItem);
      
      // Keep only max items
      if (state.searchHistory.length > state.maxHistoryItems) {
        state.searchHistory = state.searchHistory.slice(0, state.maxHistoryItems);
      }
      
      // Save to localStorage
      localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
    },
    
    removeFromSearchHistory: (state, action) => {
      state.searchHistory = state.searchHistory.filter(
        item => item.query !== action.payload
      );
      localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
    },
    
    clearSearchHistory: (state) => {
      state.searchHistory = [];
      localStorage.removeItem('searchHistory');
    },
    
    // Recent searches management
    addToRecentSearches: (state, action) => {
      const searchItem = {
        query: action.payload.query,
        filters: action.payload.filters,
        timestamp: new Date().toISOString()
      };
      
      // Remove duplicate if exists
      state.recentSearches = state.recentSearches.filter(
        item => item.query !== searchItem.query
      );
      
      // Add to beginning
      state.recentSearches.unshift(searchItem);
      
      // Keep only max items
      if (state.recentSearches.length > state.maxRecentItems) {
        state.recentSearches = state.recentSearches.slice(0, state.maxRecentItems);
      }
      
      // Save to localStorage
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    },
    
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentSearches');
    },
    
    // Suggestions management
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    
    // Pagination
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    nextPage: (state) => {
      if (state.hasMore) {
        state.currentPage += 1;
      }
    },
    
    prevPage: (state) => {
      if (state.currentPage > 1) {
        state.currentPage -= 1;
      }
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    
    // Load search history from localStorage
    loadSearchHistory: (state) => {
      try {
        const history = localStorage.getItem('searchHistory');
        if (history) {
          state.searchHistory = JSON.parse(history);
        }
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    },
    
    // Load recent searches from localStorage
    loadRecentSearches: (state) => {
      try {
        const recent = localStorage.getItem('recentSearches');
        if (recent) {
          state.recentSearches = JSON.parse(recent);
        }
      } catch (error) {
        console.error('Failed to load recent searches:', error);
      }
    },
    
    // Update search stats
    updateSearchStats: (state, action) => {
      state.searchStats = { ...state.searchStats, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Search businesses
      .addCase(searchBusinesses.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchBusinesses.fulfilled, (state, action) => {
        state.isSearching = false;
        state.results = action.payload.businesses || [];
        state.totalResults = action.payload.totalResults || 0;
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.hasMore = action.payload.hasMore || false;
        
        // Add to search history
        if (state.query || Object.values(state.filters).some(val => val)) {
          searchSlice.caseReducers.addToSearchHistory(state, {
            payload: {
              query: state.query,
              filters: state.filters,
              resultsCount: state.totalResults
            }
          });
        }
        
        // Add to recent searches
        if (state.query) {
          searchSlice.caseReducers.addToRecentSearches(state, {
            payload: {
              query: state.query,
              filters: state.filters
            }
          });
        }
      })
      .addCase(searchBusinesses.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload?.message || 'Search failed';
      })
      
      // Get search suggestions
      .addCase(getSearchSuggestions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSearchSuggestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.suggestions = action.payload.suggestions || [];
      })
      .addCase(getSearchSuggestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to get suggestions';
      })
      
      // Get popular searches
      .addCase(getPopularSearches.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPopularSearches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.popularSearches = action.payload.popularSearches || [];
      })
      .addCase(getPopularSearches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to get popular searches';
      });
  }
});

// Export actions
export const {
  setQuery,
  setFilters,
  clearFilters,
  resetSearch,
  addToSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  addToRecentSearches,
  clearRecentSearches,
  clearSuggestions,
  setPage,
  nextPage,
  prevPage,
  clearError,
  loadSearchHistory,
  loadRecentSearches,
  updateSearchStats
} = searchSlice.actions;

// Export selectors
export const selectSearchResults = (state) => state.search.results;
export const selectSearchLoading = (state) => state.search.isSearching;
export const selectSearchError = (state) => state.search.error;
export const selectSearchQuery = (state) => state.search.query;
export const selectSearchFilters = (state) => state.search.filters;
export const selectSearchHistory = (state) => state.search.searchHistory;
export const selectRecentSearches = (state) => state.search.recentSearches;
export const selectSearchSuggestions = (state) => state.search.suggestions;
export const selectPopularSearches = (state) => state.search.popularSearches;
export const selectSearchPagination = (state) => ({
  currentPage: state.search.currentPage,
  totalPages: state.search.totalPages,
  totalResults: state.search.totalResults,
  hasMore: state.search.hasMore
});
export const selectSearchStats = (state) => state.search.searchStats;

// Export reducer
export default searchSlice.reducer; 