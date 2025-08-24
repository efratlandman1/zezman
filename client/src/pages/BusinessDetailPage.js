import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
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
  Chip,
  Rating,
  Avatar,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Paper,
  Badge
} from '@mui/material';
import { 
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoIcon,
  Directions as DirectionsIcon,
  Call as CallIcon,
  Message as MessageIcon,
  Business as BusinessIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { fetchBusinessById, addToFavorites, removeFromFavorites } from '../redux/slices/businessSlice';
import { createReview, fetchBusinessReviews } from '../redux/slices/businessSlice';

import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';
import Modal from '../components/common/Modal';

const BusinessDetailPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();
  const { business, reviews, loading, error } = useSelector(state => state.business);
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.app);

  const [activeTab, setActiveTab] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchBusinessById(id));
      dispatch(fetchBusinessReviews(id));
    }
  }, [dispatch, id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFavoriteToggle = () => {
    if (business.isFavorited) {
      dispatch(removeFromFavorites(business._id));
    } else {
      dispatch(addToFavorites(business._id));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: business.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show notification
    }
  };

  const handleReviewSubmit = () => {
    dispatch(createReview({
      businessId: business._id,
      ...reviewForm
    }));
    setShowReviewModal(false);
    setReviewForm({ rating: 5, comment: '' });
  };

  const handlePhotoClick = (index) => {
    setSelectedPhoto(index);
    setShowPhotoModal(true);
  };

  const handleDirections = () => {
    const address = encodeURIComponent(business.address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:${business.phone}`, '_self');
  };

  const handleEmail = () => {
    window.open(`mailto:${business.email}`, '_self');
  };

  const handleWebsite = () => {
    window.open(business.website, '_blank');
  };

  const formatOpeningHours = (hours) => {
    if (!hours || hours.length === 0) return t('business.hours.notAvailable');
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    
    return hours.map((day, index) => {
      const dayName = t(`business.hours.${days[index]}`);
      const isToday = index === today;
      
      if (day.closed) {
        return (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
              {dayName} {isToday && `(${t('business.hours.today')})`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('business.hours.closed')}
            </Typography>
          </Box>
        );
      }
      
      const ranges = day.ranges.map(range => `${range.open} - ${range.close}`).join(', ');
      return (
        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: isToday ? 'bold' : 'normal' }}>
            {dayName} {isToday && `(${t('business.hours.today')})`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {ranges}
          </Typography>
        </Box>
      );
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !business) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error || t('business.notFound')}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title>{business.name} - Zezman</title>
        <meta name="description" content={business.description} />
        <meta property="og:title" content={business.name} />
        <meta property="og:description" content={business.description} />
        <meta property="og:image" content={business.images?.[0]} />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Business Header */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            {/* Hero Image */}
            <Box
              sx={{
                height: 400,
                backgroundImage: `url(${business.images?.[0] || '/default-business.jpg'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  display: 'flex',
                  alignItems: 'flex-end',
                  p: 3
                }}
              >
                <Box sx={{ color: 'white', flex: 1 }}>
                  <Typography variant="h3" component="h1" gutterBottom>
                    {business.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating
                      value={business.rating || 0}
                      readOnly
                      precision={0.5}
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="h6">
                      {business.rating?.toFixed(1) || '0.0'} ({business.totalRatings || 0} {t('review.plural')})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {business.address}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {user && (
                    <IconButton
                      onClick={handleFavoriteToggle}
                      sx={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.3)' }}
                    >
                      {business.isFavorited ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>
                  )}
                  <IconButton
                    onClick={handleShare}
                    sx={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.3)' }}
                  >
                    <ShareIcon />
                  </IconButton>
                  {user && business.userId === user._id && (
                    <IconButton
                      onClick={() => navigate(`/business/${business._id}/edit`)}
                      sx={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.3)' }}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          <CardContent>
            {/* Quick Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" gutterBottom>
                  {business.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {business.category && (
                    <Chip
                      icon={<CategoryIcon />}
                      label={language === 'he' ? business.category.name : business.category.nameEn}
                      color="primary"
                    />
                  )}
                  {business.services?.map((service) => (
                    <Chip
                      key={service._id}
                      label={language === 'he' ? service.name : service.nameEn}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('business.contact')}
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={business.phone}
                          secondary={t('business.phone')}
                        />
                      </ListItem>
                      
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={business.email}
                          secondary={t('business.email')}
                        />
                      </ListItem>
                      
                      {business.website && (
                        <ListItem>
                          <ListItemIcon>
                            <WebsiteIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary={business.website}
                            secondary={t('business.website')}
                          />
                        </ListItem>
                      )}
                    </List>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<CallIcon />}
                        onClick={handleCall}
                        fullWidth
                      >
                        {t('business.call')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DirectionsIcon />}
                        onClick={handleDirections}
                        fullWidth
                      >
                        {t('business.directions')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Card>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={t('business.tabs.about')} />
            <Tab label={t('business.tabs.photos')} />
            <Tab label={t('business.tabs.reviews')} />
            <Tab label={t('business.tabs.hours')} />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* About Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('business.about')}
                </Typography>
                <Typography variant="body1" paragraph>
                  {business.description}
                </Typography>
                
                {business.services && business.services.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {t('business.services')}
                    </Typography>
                    <Grid container spacing={2}>
                      {business.services.map((service) => (
                        <Grid item xs={12} sm={6} md={4} key={service._id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1">
                                {language === 'he' ? service.name : service.nameEn}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {language === 'he' ? service.description : service.descriptionEn}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}

            {/* Photos Tab */}
            {activeTab === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    {t('business.photos')} ({business.images?.length || 0})
                  </Typography>
                  {user && business.userId === user._id && (
                    <Button
                      variant="outlined"
                      startIcon={<PhotoIcon />}
                      onClick={() => navigate(`/business/${business._id}/photos`)}
                    >
                      {t('business.addPhotos')}
                    </Button>
                  )}
                </Box>
                
                {business.images && business.images.length > 0 ? (
                  <Grid container spacing={2}>
                    {business.images.map((image, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handlePhotoClick(index)}
                        >
                          <CardMedia
                            component="img"
                            height="200"
                            image={image}
                            alt={`${business.name} photo ${index + 1}`}
                          />
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="info">
                    {t('business.noPhotos')}
                  </Alert>
                )}
              </Box>
            )}

            {/* Reviews Tab */}
            {activeTab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    {t('business.reviews')} ({reviews.length})
                  </Typography>
                  {user && (
                    <Button
                      variant="contained"
                      onClick={() => setShowReviewModal(true)}
                    >
                      {t('review.write')}
                    </Button>
                  )}
                </Box>
                
                {reviews.length > 0 ? (
                  <Box>
                    {reviews.map((review) => (
                      <Card key={review._id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2 }}>
                                {review.user?.firstName?.[0] || 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1">
                                  {review.user?.firstName} {review.user?.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Rating value={review.rating} readOnly size="small" />
                          </Box>
                          
                          {review.comment && (
                            <Typography variant="body1">
                              {review.comment}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">
                    {t('business.noReviews')}
                  </Alert>
                )}
              </Box>
            )}

            {/* Hours Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {t('business.openingHours')}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {formatOpeningHours(business.openingHours)}
                </Paper>
              </Box>
            )}
          </Box>
        </Card>
      </Container>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={t('review.write')}
        size="md"
      >
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>{t('review.rating')}</InputLabel>
            <Select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
              label={t('review.rating')}
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <MenuItem key={rating} value={rating}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating value={rating} readOnly size="small" />
                    <Typography sx={{ ml: 1 }}>
                      {rating} {t('review.stars')}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('review.comment')}
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setShowReviewModal(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleReviewSubmit}
            >
              {t('review.submit')}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Photo Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title=""
        size="lg"
      >
        <Box sx={{ p: 2 }}>
          <img
            src={business.images?.[selectedPhoto]}
            alt={`${business.name} photo ${selectedPhoto + 1}`}
            style={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </Box>
      </Modal>

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

export default BusinessDetailPage; 