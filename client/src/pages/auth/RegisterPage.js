import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  Stepper,
  Step,
  StepLabel,
  Grid
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { register, registerWithGoogle } from '../../redux/slices/authSlice';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const RegisterPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.app);

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToMarketing: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Get redirect path from location state or query params
  const from = location.state?.from?.pathname || new URLSearchParams(location.search).get('redirect') || '/';

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) {
          errors.firstName = t('validation.firstName.required');
        }
        if (!formData.lastName.trim()) {
          errors.lastName = t('validation.lastName.required');
        }
        if (!formData.email) {
          errors.email = t('validation.email.required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = t('validation.email.invalid');
        }
        if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
          errors.phone = t('validation.phone.invalid');
        }
        break;
        
      case 1: // Password
        if (!formData.password) {
          errors.password = t('validation.password.required');
        } else if (formData.password.length < 8) {
          errors.password = t('validation.password.minLength');
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
          errors.password = t('validation.password.complexity');
        }
        if (!formData.confirmPassword) {
          errors.confirmPassword = t('validation.confirmPassword.required');
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = t('validation.confirmPassword.mismatch');
        }
        break;
        
      case 2: // Terms
        if (!formData.agreeToTerms) {
          errors.agreeToTerms = t('validation.terms.required');
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(activeStep)) {
      return;
    }

    try {
      await dispatch(register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        agreeToMarketing: formData.agreeToMarketing
      })).unwrap();
      
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await dispatch(registerWithGoogle()).unwrap();
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const steps = [
    t('auth.register.steps.personal'),
    t('auth.register.steps.password'),
    t('auth.register.steps.terms')
  ];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.firstName')}
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('auth.lastName')}
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('auth.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('auth.phone')}
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('auth.password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('auth.confirmPassword')}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  {t('auth.register.agreeToTerms')}{' '}
                  <MuiLink href="/terms" target="_blank" sx={{ textDecoration: 'none' }}>
                    {t('auth.register.termsOfService')}
                  </MuiLink>
                  {' '}{t('common.and')}{' '}
                  <MuiLink href="/privacy" target="_blank" sx={{ textDecoration: 'none' }}>
                    {t('auth.register.privacyPolicy')}
                  </MuiLink>
                </Typography>
              }
            />
            {formErrors.agreeToTerms && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {formErrors.agreeToTerms}
              </Typography>
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToMarketing"
                  checked={formData.agreeToMarketing}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  {t('auth.register.agreeToMarketing')}
                </Typography>
              }
              sx={{ mt: 2 }}
            />
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.register.title')} - Zezman</title>
        <meta name="description" content={t('auth.register.description')} />
      </Helmet>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {t('auth.register.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {t('auth.register.subtitle')}
          </Typography>
        </Box>

        <Card sx={{ p: 4 }}>
          <CardContent>
            {/* Google Register Button */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleRegister}
              disabled={loading}
              sx={{ 
                mb: 3,
                py: 1.5,
                borderColor: '#db4437',
                color: '#db4437',
                '&:hover': {
                  borderColor: '#c23321',
                  backgroundColor: 'rgba(219, 68, 55, 0.04)'
                }
              }}
            >
              {t('auth.register.withGoogle')}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('auth.register.or')}
              </Typography>
            </Divider>

            {/* Registration Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step Content */}
            <Box component="form" onSubmit={handleSubmit}>
              {renderStepContent(activeStep)}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0 || loading}
                >
                  {t('common.back')}
                </Button>
                
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? <LoadingSpinner size="small" /> : t('auth.register.button')}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      {t('common.next')}
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('auth.register.haveAccount')}{' '}
                <MuiLink
                  component={Link}
                  to="/auth/login"
                  variant="body2"
                  sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                >
                  {t('auth.register.signIn')}
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Error Notification */}
      {error && (
        <Notification
          type="error"
          title={t('auth.register.error')}
          message={typeof error === 'string' ? error : error?.message || error?.error || 'An error occurred'}
        />
      )}
    </>
  );
};

export default RegisterPage; 