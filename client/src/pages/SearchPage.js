import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  Skeleton,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn as LocationIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { searchBusinesses, fetchCategories, fetchServices } from '../redux/slices/businessSlice';
import { addToFavorites, removeFromFavorites } from '../redux/slices/businessSlice';

import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const SearchPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchResults, categories, services, loading, error, totalPages, currentPage } = useSelector(state => state.business);
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.app);

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedServices, setSelectedServices] = useState([]);
  const [ratingFilter, setRatingFilter] = useState([0, 5]);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchServices());
  }, [dispatch]);

  useEffect(() => {
    performSearch();
  }, [page, sortBy]);

  const performSearch = () => {
    const searchData = {
      query: searchQuery,
      location,
      category: selectedCategory,
      services: selectedServices,
      minRating: ratingFilter[0],
      maxRating: ratingFilter[1],
      sortBy,
      page
    };

    dispatch(searchBusinesses(searchData));
    
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    if (selectedCategory) params.set('category', selectedCategory);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params);
  };

  const handleSearch = () => {
    setPage(1);
    performSearch();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setSelectedCategory('');
    setSelectedServices([]);
    setRatingFilter([0, 5]);
    setSortBy('relevance');
    setPage(1);
    setSearchParams({});
  };

  const handleFavoriteToggle = (businessId, isFavorited) => {
    if (isFavorited) {
      dispatch(removeFromFavorites(businessId));
    } else {
      dispatch(addToFavorites(businessId));
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleBusinessClick = (businessId) => {
    window.location.href = `/business/${businessId}`;
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const sortOptions = [
    { value: 'relevance', label: t('search.sort.relevance') },
    { value: 'rating', label: t('search.sort.rating') },
    { value: 'distance', label: t('search.sort.distance') },
    { value: 'name', label: t('search.sort.name') },
    { value: 'newest', label: t('search.sort.newest') }
  ];

  return (
    <>
      <Helmet>
        <title>{t('search.title')} - Zezman</title>
        <meta name="description" content={t('search.description')} />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Search Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {t('search.title')}
          </Typography>
          
          {/* Search Bar */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder={t('search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                placeholder={t('search.location')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                onClick={handleSearch}
                fullWidth
              >
                {t('search.button')}
              </Button>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {t('search.filters')}
                </Button>
                <Tooltip title={t('search.clearFilters')}>
                  <IconButton onClick={handleClearFilters}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          {/* Filters Section */}
          {showFilters && (
            <Accordion defaultExpanded sx={{ mb: 3 }}>
              <AccordionSummary expandIcon={<FilterIcon />}>
                <Typography variant="h6">{t('search.advancedFilters')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Category Filter */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>{t('search.category')}</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label={t('search.category')}
                      >
                        <MenuItem value="">{t('search.allCategories')}</MenuItem>
                        {categories.map((category) => (
                          <MenuItem key={category._id} value={category._id}>
                            {language === 'he' ? category.name : category.nameEn}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Services Filter */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>{t('search.services')}</InputLabel>
                      <Select
                        multiple
                        value={selectedServices}
                        onChange={(e) => setSelectedServices(e.target.value)}
                        label={t('search.services')}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const service = services.find(s => s._id === value);
                              return (
                                <Chip 
                                  key={value} 
                                  label={language === 'he' ? service?.name : service?.nameEn} 
                                  size="small" 
                                />
                              );
                            })}
                          </Box>
                        )}
                      >
                        {services.map((service) => (
                          <MenuItem key={service._id} value={service._id}>
                            {language === 'he' ? service.name : service.nameEn}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Rating Filter */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography gutterBottom>{t('search.rating')}</Typography>
                    <Slider
                      value={ratingFilter}
                      onChange={(e, newValue) => setRatingFilter(newValue)}
                      valueLabelDisplay="auto"
                      min={0}
                      max={5}
                      step={0.5}
                      marks={[
                        { value: 0, label: '0' },
                        { value: 5, label: '5' }
                      ]}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {ratingFilter[0]} - {ratingFilter[1]} {t('search.stars')}
                    </Typography>
                  </Grid>

                  {/* Sort Options */}
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>{t('search.sortBy')}</InputLabel>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        label={t('search.sortBy')}
                      >
                        {sortOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>

        {/* Results Section */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Sidebar Filters */}
          <Box sx={{ width: 280, display: { xs: 'none', md: 'block' } }}>
            <Typography variant="h6" gutterBottom>
              {t('search.filters')}
            </Typography>

            {/* Categories */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('search.categories')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {categories.map((category) => (
                  <Chip
                    key={category._id}
                    label={`${language === 'he' ? category.name : category.nameEn} (${category.businessCount || 0})`}
                    variant={selectedCategory === category._id ? 'filled' : 'outlined'}
                    color={selectedCategory === category._id ? 'primary' : 'default'}
                    onClick={() => handleCategoryClick(category._id)}
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Box>
            </Box>

            {/* Services */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('search.services')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {services.map((service) => (
                  <Chip
                    key={service._id}
                    label={language === 'he' ? service.name : service.nameEn}
                    variant={selectedServices.includes(service._id) ? 'filled' : 'outlined'}
                    color={selectedServices.includes(service._id) ? 'primary' : 'default'}
                    onClick={() => handleServiceToggle(service._id)}
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            {/* Results Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                {loading ? t('search.loading') : `${searchResults.length} ${t('search.results')}`}
              </Typography>
              
              <FormControl sx={{ minWidth: 200 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  size="small"
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Results Grid */}
            {loading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <Skeleton variant="rectangular" height={200} />
                      <CardContent>
                        <Skeleton variant="text" height={32} />
                        <Skeleton variant="text" height={24} />
                        <Skeleton variant="text" height={20} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : searchResults.length > 0 ? (
              <>
                <Grid container spacing={3}>
                  {searchResults.map((business) => (
                    <Grid item xs={12} sm={6} md={4} key={business._id}>
                      <Card
                        sx={{
                          height: '100%',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                        onClick={() => handleBusinessClick(business._id)}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={business.images?.[0] || '/default-business.jpg'}
                          alt={business.name}
                        />
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                              {business.name}
                            </Typography>
                            {user && (
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFavoriteToggle(business._id, business.isFavorited);
                                }}
                                size="small"
                              >
                                {business.isFavorited ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                              </IconButton>
                            )}
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {business.description?.substring(0, 100)}...
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Rating
                              value={business.rating || 0}
                              readOnly
                              size="small"
                              precision={0.5}
                            />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              ({business.totalRatings || 0})
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {business.address}
                            </Typography>
                          </Box>

                          {business.category && (
                            <Chip
                              label={language === 'he' ? business.category.name : business.category.nameEn}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('search.noResults')}
              </Alert>
            )}
          </Box>
        </Box>
      </Container>

      {/* Error Notification */}
      {error && (
        <Notification
          type="error"
          title={t('errors.general')}
          message={typeof error === 'string' ? error : error?.message || error?.error || 'An error occurred'}
        />
      )}
    </>
  );
};

export default SearchPage; 