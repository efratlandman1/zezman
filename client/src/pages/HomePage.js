import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
  Avatar,
  Skeleton
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocationOn as LocationIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { fetchFeaturedBusinesses } from '../redux/slices/businessSlice';
import { fetchCategories } from '../redux/slices/businessSlice';

import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

const HomePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { 
    featuredBusinesses, 
    categories, 
    isLoading, 
    isLoadingFeatured, 
    isLoadingCategories, 
    error 
  } = useSelector(state => state.business);
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.app);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [location, setLocation] = useState('');
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    dispatch(fetchFeaturedBusinesses());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Handle server connection timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!featuredBusinesses?.length && !categories?.length) {
        setShowTimeoutMessage(true);
      }
    }, 8000); // Show timeout message after 8 seconds

    return () => clearTimeout(timeoutId);
  }, [featuredBusinesses, categories]);

  const handleSearch = () => {
    // Navigate to search page with query
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory || ''}&location=${encodeURIComponent(location)}`;
  };

  const handleCategoryClick = (categoryId) => {
    window.location.href = `/search?category=${categoryId}`;
  };

  const handleBusinessClick = (businessId) => {
    window.location.href = `/business/${businessId}`;
  };

  // ALWAYS SHOW CONTENT - NO SPINNER

  // Debug logging
  console.log('HomePage Debug:', {
    isLoading,
    isLoadingFeatured,
    isLoadingCategories,
    featuredBusinessesCount: featuredBusinesses?.length || 0,
    categoriesCount: categories?.length || 0,
    error
  });

  return (
    <>
      <Helmet>
        <title>{t('home.title')} - Zezman</title>
        <meta name="description" content={t('home.description')} />
        <meta name="keywords" content={t('home.keywords')} />
      </Helmet>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                {t('home.hero.title')}
              </Typography>
              <Typography variant="h5" paragraph>
                {t('home.hero.subtitle')}
              </Typography>
              
              {/* Search Bar */}
              <Box sx={{ mt: 4 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      placeholder={t('search.placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: 1
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      placeholder={t('search.location')}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: 1
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      fullWidth
                      sx={{ 
                        height: 56,
                        backgroundColor: '#ff6b6b',
                        '&:hover': { backgroundColor: '#ff5252' }
                      }}
                    >
                      {t('search.button')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400
                }}
              >
                <BusinessIcon sx={{ fontSize: 200, opacity: 0.3 }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center">
          {t('home.categories.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" paragraph>
          {t('home.categories.subtitle')}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {!categories || categories.length === 0 ? (
            // No categories available
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {error ? 'Failed to load categories' : 'No categories available'}
                </Typography>
                {error && (
                  <Typography variant="body2" color="text.secondary">
                    Please check if the server is running and try again
                  </Typography>
                )}
              </Box>
            </Grid>
          ) : (
            categories.slice(0, 8).map((category) => (
              <Grid item xs={6} sm={4} md={3} key={category._id}>
                <Card
                  sx={{
                    height: 200,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleCategoryClick(category._id)}
                >
                  <CardContent
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center'
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        mb: 2,
                        backgroundColor: 'primary.main'
                      }}
                    >
                      <CategoryIcon />
                    </Avatar>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {language === 'he' ? category.name : category.nameEn}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.businessCount || 0} {t('business.plural')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      {/* Featured Businesses Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" gutterBottom align="center">
            {t('home.featured.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary" align="center" paragraph>
            {t('home.featured.subtitle')}
          </Typography>

          <Grid container spacing={3}>
            {!featuredBusinesses || featuredBusinesses.length === 0 ? (
              // No featured businesses available
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {error ? 'Failed to load featured businesses' : 'No featured businesses available'}
                  </Typography>
                  {error && (
                    <Typography variant="body2" color="text.secondary">
                      Please check if the server is running and try again
                    </Typography>
                  )}
                </Box>
              </Grid>
            ) : (
              featuredBusinesses.slice(0, 6).map((business) => (
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
                      image={business.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwQzExMC40NTcgMTIwIDExOSAxMTEuNDU3IDExOSAxMDFDMTE5IDkwLjU0MzQgMTEwLjQ1NyA4MiAxMDAgODJDODkuNTQzNCA4MiA4MSA5MC41NDM0IDgxIDEwMUM4MSAxMTEuNDU3IDg5LjU0MzQgMTIwIDEwMCAxMjBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzExMC40NTcgMTQwIDExOSAxMzEuNDU3IDExOSAxMjFDMTE5IDExMC41NDMgMTEwLjQ1NyAxMDIgMTAwIDEwMkM4OS41NDM0IDEwMiA4MSAxMTAuNTQzIDgxIDEyMUM4MSAxMzEuNDU3IDg5LjU0MzQgMTQwIDEwMCAxNDBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPgo='}
                      alt={business.name}
                    />
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {business.name}
                      </Typography>
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
              ))
            )}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => window.location.href = '/search'}
            >
              {t('home.featured.viewAll')}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                1000+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {t('home.stats.businesses')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                50+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {t('home.stats.categories')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                5000+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {t('home.stats.reviews')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" color="primary" gutterBottom>
                10000+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {t('home.stats.users')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
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

export default HomePage; 