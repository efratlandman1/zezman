import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

// Import components
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Import pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.app);

  // Set document direction based on language
  useEffect(() => {
    const direction = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  return (
    <div className="app" data-testid="app">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/search" element={<Layout><SearchPage /></Layout>} />
        <Route path="/business/:id" element={<Layout><BusinessDetailPage /></Layout>} />
        
        {/* Auth routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        
        {/* 404 route */}
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </div>
  );
};

export default App; 