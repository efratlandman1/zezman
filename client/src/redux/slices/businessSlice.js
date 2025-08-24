import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import businessService from '../../services/businessAPI';
import categoryService from '../../services/categoryAPI';
import serviceService from '../../services/serviceAPI';

// Async thunks
export const fetchBusinesses = createAsyncThunk(
  'business/fetchBusinesses',
  async (params, { rejectWithValue }) => {
    try {
      const response = await businessService.getAllBusinesses(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch businesses');
    }
  }
);

export const fetchBusinessById = createAsyncThunk(
  'business/fetchBusinessById',
  async (businessId, { rejectWithValue }) => {
    try {
      const response = await businessService.getBusinessById(businessId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch business');
    }
  }
);

export const searchBusinesses = createAsyncThunk(
  'business/searchBusinesses',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await businessService.searchBusinesses(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Search failed');
    }
  }
);

export const fetchFeaturedBusinesses = createAsyncThunk(
  'business/fetchFeaturedBusinesses',
  async (params, { rejectWithValue }) => {
    try {
      const response = await businessService.getFeaturedBusinesses(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch featured businesses');
    }
  }
);

export const fetchNearbyBusinesses = createAsyncThunk(
  'business/fetchNearbyBusinesses',
  async (params, { rejectWithValue }) => {
    try {
      const response = await businessService.getNearbyBusinesses(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch nearby businesses');
    }
  }
);

export const createBusiness = createAsyncThunk(
  'business/createBusiness',
  async (businessData, { rejectWithValue }) => {
    try {
      const response = await businessService.createBusiness(businessData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create business');
    }
  }
);

export const updateBusiness = createAsyncThunk(
  'business/updateBusiness',
  async ({ businessId, businessData }, { rejectWithValue }) => {
    try {
      const response = await businessService.updateBusiness(businessId, businessData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update business');
    }
  }
);

export const deleteBusiness = createAsyncThunk(
  'business/deleteBusiness',
  async (businessId, { rejectWithValue }) => {
    try {
      await businessService.deleteBusiness(businessId);
      return businessId;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete business');
    }
  }
);

export const fetchUserBusinesses = createAsyncThunk(
  'business/fetchUserBusinesses',
  async (params, { rejectWithValue }) => {
    try {
      const response = await businessService.getUserBusinesses(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch user businesses');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'business/fetchCategories',
  async (params, { rejectWithValue }) => {
    try {
      const response = await categoryService.getCategories(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch categories');
    }
  }
);

export const fetchServices = createAsyncThunk(
  'business/fetchServices',
  async (params, { rejectWithValue }) => {
    try {
      const response = await serviceService.getServices(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch services');
    }
  }
);

export const addToFavorites = createAsyncThunk(
  'business/addToFavorites',
  async (businessId, { rejectWithValue }) => {
    try {
      const response = await businessService.addToFavorites(businessId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add to favorites');
    }
  }
);

export const removeFromFavorites = createAsyncThunk(
  'business/removeFromFavorites',
  async (businessId, { rejectWithValue }) => {
    try {
      const response = await businessService.removeFromFavorites(businessId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to remove from favorites');
    }
  }
);

export const createReview = createAsyncThunk(
  'business/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await businessService.createReview(reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create review');
    }
  }
);

export const fetchBusinessReviews = createAsyncThunk(
  'business/fetchBusinessReviews',
  async (businessId, { rejectWithValue }) => {
    try {
      const response = await businessService.getBusinessReviews(businessId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch reviews');
    }
  }
);

// Initial state
const initialState = {
  businesses: [],
  currentBusiness: null,
  featuredBusinesses: [],
  nearbyBusinesses: [],
  userBusinesses: [],
  searchResults: [],
  categories: [],
  services: [],
  reviews: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  isLoading: false,
  isLoadingFeatured: false,
  isLoadingCategories: false,
  error: null,
  filters: {
    category: '',
    rating: '',
    city: '',
    featured: false,
    verified: false,
  },
  searchParams: {
    q: '',
    category: '',
    minRating: '',
    maxDistance: '',
    lat: '',
    lng: '',
    services: [],
    sort: 'relevance',
  },
};

// Business slice
const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSearchParams: (state, action) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    clearSearchParams: (state) => {
      state.searchParams = initialState.searchParams;
    },
    clearCurrentBusiness: (state) => {
      state.currentBusiness = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    addToRecentBusinesses: (state, action) => {
      const business = action.payload;
      const existingIndex = state.recentBusinesses?.findIndex(
        b => b._id === business._id
      );
      
      if (!state.recentBusinesses) {
        state.recentBusinesses = [];
      }
      
      if (existingIndex > -1) {
        state.recentBusinesses.splice(existingIndex, 1);
      }
      
      state.recentBusinesses.unshift(business);
      
      if (state.recentBusinesses.length > 10) {
        state.recentBusinesses = state.recentBusinesses.slice(0, 10);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch businesses
      .addCase(fetchBusinesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinesses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.businesses = action.payload.data?.businesses || action.payload.businesses || [];
        state.pagination = action.payload.data?.pagination || action.payload.pagination || state.pagination;
      })
      .addCase(fetchBusinesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch businesses';
      })
      
      // Fetch business by ID
      .addCase(fetchBusinessById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinessById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBusiness = action.payload.data?.business || action.payload.business;
      })
      .addCase(fetchBusinessById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch business';
      })
      
      // Search businesses
      .addCase(searchBusinesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchBusinesses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.data?.businesses || action.payload.businesses || [];
        state.pagination = action.payload.data?.pagination || action.payload.pagination || state.pagination;
      })
      .addCase(searchBusinesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Search failed';
      })
      
      // Fetch featured businesses
      .addCase(fetchFeaturedBusinesses.pending, (state) => {
        state.isLoadingFeatured = true;
        state.error = null;
      })
      .addCase(fetchFeaturedBusinesses.fulfilled, (state, action) => {
        state.isLoadingFeatured = false;
        state.featuredBusinesses = action.payload.data?.businesses || action.payload.businesses || [];
      })
      .addCase(fetchFeaturedBusinesses.rejected, (state, action) => {
        state.isLoadingFeatured = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch featured businesses';
      })
      
      // Fetch nearby businesses
      .addCase(fetchNearbyBusinesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNearbyBusinesses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nearbyBusinesses = action.payload.data?.businesses || action.payload.businesses || [];
      })
      .addCase(fetchNearbyBusinesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch nearby businesses';
      })
      
      // Create business
      .addCase(createBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBusiness.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userBusinesses.unshift(action.payload.data?.business || action.payload.business);
      })
      .addCase(createBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to create business';
      })
      
      // Update business
      .addCase(updateBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBusiness.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedBusiness = action.payload.data?.business || action.payload.business;
        
        // Update in various lists
        const updateInList = (list) => {
          const index = list.findIndex(b => b._id === updatedBusiness._id);
          if (index !== -1) {
            list[index] = updatedBusiness;
          }
        };
        
        updateInList(state.businesses);
        updateInList(state.featuredBusinesses);
        updateInList(state.nearbyBusinesses);
        updateInList(state.userBusinesses);
        updateInList(state.searchResults);
        
        if (state.currentBusiness?._id === updatedBusiness._id) {
          state.currentBusiness = updatedBusiness;
        }
      })
      .addCase(updateBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to update business';
      })
      
      // Delete business
      .addCase(deleteBusiness.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBusiness.fulfilled, (state, action) => {
        state.isLoading = false;
        const deletedBusinessId = action.payload;
        
        // Remove from various lists
        const removeFromList = (list) => {
          return list.filter(b => b._id !== deletedBusinessId);
        };
        
        state.businesses = removeFromList(state.businesses);
        state.featuredBusinesses = removeFromList(state.featuredBusinesses);
        state.nearbyBusinesses = removeFromList(state.nearbyBusinesses);
        state.userBusinesses = removeFromList(state.userBusinesses);
        state.searchResults = removeFromList(state.searchResults);
        
        if (state.currentBusiness?._id === deletedBusinessId) {
          state.currentBusiness = null;
        }
      })
      .addCase(deleteBusiness.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to delete business';
      })
      
      // Fetch user businesses
      .addCase(fetchUserBusinesses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserBusinesses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userBusinesses = action.payload.data?.businesses || action.payload.businesses || [];
        state.pagination = action.payload.data?.pagination || action.payload.pagination || state.pagination;
      })
      .addCase(fetchUserBusinesses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch user businesses';
      })
      
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoadingCategories = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoadingCategories = false;
        state.categories = action.payload.data || action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoadingCategories = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch categories';
      })
      
      // Fetch services
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.services = action.payload.data?.services || action.payload.services || [];
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch services';
      })
      
      // Add to favorites
      .addCase(addToFavorites.fulfilled, (state, action) => {
        const businessId = action.payload.businessId;
        const updateBusinessInList = (list) => {
          const business = list.find(b => b._id === businessId);
          if (business) {
            business.isFavorited = true;
            business.favoriteCount = (business.favoriteCount || 0) + 1;
          }
        };
        
        updateBusinessInList(state.businesses);
        updateBusinessInList(state.featuredBusinesses);
        updateBusinessInList(state.nearbyBusinesses);
        updateBusinessInList(state.userBusinesses);
        updateBusinessInList(state.searchResults);
        
        if (state.currentBusiness?._id === businessId) {
          state.currentBusiness.isFavorited = true;
          state.currentBusiness.favoriteCount = (state.currentBusiness.favoriteCount || 0) + 1;
        }
      })
      
      // Remove from favorites
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        const businessId = action.payload.businessId;
        const updateBusinessInList = (list) => {
          const business = list.find(b => b._id === businessId);
          if (business) {
            business.isFavorited = false;
            business.favoriteCount = Math.max(0, (business.favoriteCount || 0) - 1);
          }
        };
        
        updateBusinessInList(state.businesses);
        updateBusinessInList(state.featuredBusinesses);
        updateBusinessInList(state.nearbyBusinesses);
        updateBusinessInList(state.userBusinesses);
        updateBusinessInList(state.searchResults);
        
        if (state.currentBusiness?._id === businessId) {
          state.currentBusiness.isFavorited = false;
          state.currentBusiness.favoriteCount = Math.max(0, (state.currentBusiness.favoriteCount || 0) - 1);
        }
      })
      
      // Create review
      .addCase(createReview.fulfilled, (state, action) => {
        const newReview = action.payload.review;
        state.reviews.unshift(newReview);
        
        // Update business rating if it's the current business
        if (state.currentBusiness?._id === newReview.businessId) {
          state.currentBusiness.totalRatings = (state.currentBusiness.totalRatings || 0) + 1;
          // Recalculate average rating
          const allReviews = state.reviews.filter(r => r.businessId === newReview.businessId);
          const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
          state.currentBusiness.rating = Math.round(avgRating * 10) / 10;
        }
      })
      
      // Fetch business reviews
      .addCase(fetchBusinessReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinessReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.reviews;
      })
      .addCase(fetchBusinessReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || action.payload?.error || 'Failed to fetch reviews';
      });
  },
});

// Export actions
export const {
  clearError,
  setFilters,
  clearFilters,
  setSearchParams,
  clearSearchParams,
  clearCurrentBusiness,
  clearSearchResults,
  addToRecentBusinesses,
} = businessSlice.actions;

// Export selectors
export const selectBusinesses = (state) => state.business.businesses;
export const selectCurrentBusiness = (state) => state.business.currentBusiness;
export const selectFeaturedBusinesses = (state) => state.business.featuredBusinesses;
export const selectNearbyBusinesses = (state) => state.business.nearbyBusinesses;
export const selectUserBusinesses = (state) => state.business.userBusinesses;
export const selectSearchResults = (state) => state.business.searchResults;
export const selectCategories = (state) => state.business.categories;
export const selectServices = (state) => state.business.services;
export const selectReviews = (state) => state.business.reviews;
export const selectPagination = (state) => state.business.pagination;
export const selectIsLoading = (state) => state.business.isLoading;
export const selectError = (state) => state.business.error;
export const selectFilters = (state) => state.business.filters;
export const selectSearchParams = (state) => state.business.searchParams;

// Export reducer
export default businessSlice.reducer; 