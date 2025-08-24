import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Container, 
  Typography, 
  Box, 
  Button 
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';


const NotFoundPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>{t('errors.notFound.title')} - Zezman</title>
        <meta name="description" content={t('errors.notFound.description')} />
      </Helmet>

      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box
          sx={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}
        >
          <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
            404
          </Typography>
          
          <Typography variant="h3" component="h2" gutterBottom>
            {t('errors.notFound.title')}
          </Typography>
          
          <Typography variant="h6" color="text.secondary" paragraph>
            {t('errors.notFound.message')}
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
          >
            {t('errors.notFound.goHome')}
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default NotFoundPage; 