import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  TextField, 
  InputAdornment,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Search as SearchIcon,
  AccountCircle as AccountIcon,
  Business as BusinessIcon,
  Favorite as FavoriteIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Language as LanguageIcon,
  Add as AddIcon,
  Home as HomeIcon,
  Search as SearchPageIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { logout } from '../../redux/slices/authSlice';
import { setLanguage } from '../../redux/slices/appSlice';
import LoadingSpinner from '../common/LoadingSpinner';

const Header = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, loading } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.app);

  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleUserMenuClose();
    navigate('/');
  };

  const handleLanguageChange = (newLanguage) => {
    dispatch(setLanguage(newLanguage));
    setLanguageMenuAnchor(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: '/', label: t('nav.home'), icon: <HomeIcon /> },
    { path: '/search', label: t('nav.search'), icon: <SearchPageIcon /> },
    { path: '/categories', label: t('nav.categories'), icon: <BusinessIcon /> }
  ];

  const userMenuItems = [
    { 
      label: t('nav.profile'), 
      icon: <PersonIcon />, 
      action: () => navigate('/profile'),
      divider: false
    },
    { 
      label: t('nav.myBusinesses'), 
      icon: <BusinessIcon />, 
      action: () => navigate('/my-businesses'),
      divider: false
    },
    { 
      label: t('nav.favorites'), 
      icon: <FavoriteIcon />, 
      action: () => navigate('/favorites'),
      divider: false
    },
    { 
      label: t('nav.settings'), 
      icon: <SettingsIcon />, 
      action: () => navigate('/settings'),
      divider: true
    },
    { 
      label: t('nav.logout'), 
      icon: <LogoutIcon />, 
      action: handleLogout,
      divider: false
    }
  ];

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            mr: 3
          }}
        >
          Zezman
        </Typography>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                sx={{
                  textTransform: 'none',
                  backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Search Bar */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{ 
            flexGrow: 1, 
            maxWidth: 600, 
            mx: { xs: 1, md: 3 },
            display: { xs: 'none', sm: 'block' }
          }}
        >
          <TextField
            fullWidth
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }
            }}
          />
        </Box>

        {/* Language Switcher */}
        <IconButton
          color="inherit"
          onClick={(e) => setLanguageMenuAnchor(e.currentTarget)}
          sx={{ mr: 1 }}
        >
          <LanguageIcon />
        </IconButton>

        {/* User Menu / Auth Buttons */}
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Add Business Button */}
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<AddIcon />}
              onClick={() => navigate('/business/add')}
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.8)'
                }
              }}
            >
              {t('nav.addBusiness')}
            </Button>

            {/* User Avatar */}
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{ color: 'inherit' }}
            >
              <Badge
                badgeContent={user.notifications?.unread || 0}
                color="error"
              >
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32,
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }}
                >
                  {user.firstName?.[0] || user.email[0].toUpperCase()}
                </Avatar>
              </Badge>
            </IconButton>

            {/* User Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {/* User Info */}
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle2">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              
              {/* Menu Items */}
              {userMenuItems.map((item, index) => (
                <React.Fragment key={index}>
                  <MenuItem onClick={item.action}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText>{item.label}</ListItemText>
                  </MenuItem>
                  {item.divider && <Divider />}
                </React.Fragment>
              ))}
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/auth/login"
              color="inherit"
              sx={{ textTransform: 'none' }}
            >
              {t('auth.login.title')}
            </Button>
            <Button
              component={Link}
              to="/auth/register"
              variant="contained"
              sx={{ 
                textTransform: 'none',
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              {t('auth.register.title')}
            </Button>
          </Box>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            color="inherit"
            onClick={handleMobileMenuToggle}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* Mobile Search Bar */}
      {isMobile && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Box component="form" onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  }
                }
              }}
            />
          </Box>
        </Box>
      )}

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        PaperProps={{
          sx: { width: 280 }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('nav.menu')}
          </Typography>
        </Box>
        
        <List>
          {/* Navigation Items */}
          {navigationItems.map((item) => (
            <ListItem
              key={item.path}
              button
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
          
          <Divider sx={{ my: 2 }} />
          
          {/* User-specific items */}
          {user ? (
            <>
              <ListItem button onClick={() => handleNavigation('/business/add')}>
                <ListItemIcon><AddIcon /></ListItemIcon>
                <ListItemText primary={t('nav.addBusiness')} />
              </ListItem>
              
              {userMenuItems.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem button onClick={() => { item.action(); handleMobileMenuClose(); }}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItem>
                  {item.divider && <Divider />}
                </React.Fragment>
              ))}
            </>
          ) : (
            <>
              <ListItem button onClick={() => handleNavigation('/auth/login')}>
                <ListItemIcon><AccountIcon /></ListItemIcon>
                <ListItemText primary={t('auth.login.title')} />
              </ListItem>
              <ListItem button onClick={() => handleNavigation('/auth/register')}>
                <ListItemIcon><AddIcon /></ListItemIcon>
                <ListItemText primary={t('auth.register.title')} />
              </ListItem>
            </>
          )}
        </List>
      </Drawer>

      {/* Language Menu */}
      <Menu
        anchorEl={languageMenuAnchor}
        open={Boolean(languageMenuAnchor)}
        onClose={() => setLanguageMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
        >
          English
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('he')}
          selected={language === 'he'}
        >
          עברית
        </MenuItem>
      </Menu>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <LoadingSpinner />
        </Box>
      )}
    </AppBar>
  );
};

export default Header; 