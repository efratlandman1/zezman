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
  Link as MuiLink
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { login, loginWithGoogle } from '../../redux/slices/authSlice';

import LoadingSpinner from '../../components/common/LoadingSpinner';
import Notification from '../../components/common/Notification';

const LoginPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.app);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = t('validation.email.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t('validation.email.invalid');
    }
    
    if (!formData.password) {
      errors.password = t('validation.password.required');
    } else if (formData.password.length < 6) {
      errors.password = t('validation.password.minLength');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(login({
        email: formData.email,
        password: formData.password,
        rememberMe
      })).unwrap();
      
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await dispatch(loginWithGoogle()).unwrap();
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Helmet>
        <title>{t('auth.login.title')} - Zezman</title>
        <meta name="description" content={t('auth.login.description')} />
      </Helmet>

      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            {t('auth.login.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {t('auth.login.subtitle')}
          </Typography>
        </Box>

        <Card sx={{ p: 4 }}>
          <CardContent>
            {/* Google Login Button */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
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
              {t('auth.login.withGoogle')}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('auth.login.or')}
              </Typography>
            </Divider>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
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
                sx={{ mb: 3 }}
              />

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
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={t('auth.login.rememberMe')}
                />
                <MuiLink
                  component={Link}
                  to="/auth/forgot-password"
                  variant="body2"
                  sx={{ textDecoration: 'none' }}
                >
                  {t('auth.login.forgotPassword')}
                </MuiLink>
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ mb: 3, py: 1.5 }}
              >
                {loading ? <LoadingSpinner size="small" /> : t('auth.login.button')}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('auth.login.noAccount')}{' '}
                  <MuiLink
                    component={Link}
                    to="/auth/register"
                    variant="body2"
                    sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    {t('auth.login.signUp')}
                  </MuiLink>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Demo Account Info */}
        <Card sx={{ mt: 3, p: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('auth.login.demoTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('auth.login.demoDescription')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>{t('auth.login.demoEmail')}:</strong> demo@zezman.com
              </Typography>
              <Typography variant="body2">
                <strong>{t('auth.login.demoPassword')}:</strong> demo123
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Error Notification */}
      {error && (
        <Notification
          type="error"
          title={t('auth.login.error')}
          message={typeof error === 'string' ? error : error?.message || error?.error || 'An error occurred'}
        />
      )}
    </>
  );
};

export default LoginPage; 