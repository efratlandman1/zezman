import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link as MuiLink,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const Footer = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { language } = useSelector(state => state.app);

  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t('footer.company.title'),
      links: [
        { label: t('footer.company.about'), path: '/about' },
        { label: t('footer.company.contact'), path: '/contact' },
        { label: t('footer.company.careers'), path: '/careers' },
        { label: t('footer.company.press'), path: '/press' }
      ]
    },
    {
      title: t('footer.business.title'),
      links: [
        { label: t('footer.business.add'), path: '/business/add' },
        { label: t('footer.business.claim'), path: '/business/claim' },
        { label: t('footer.business.advertise'), path: '/business/advertise' },
        { label: t('footer.business.partners'), path: '/business/partners' }
      ]
    },
    {
      title: t('footer.support.title'),
      links: [
        { label: t('footer.support.help'), path: '/help' },
        { label: t('footer.support.faq'), path: '/faq' },
        { label: t('footer.support.feedback'), path: '/feedback' },
        { label: t('footer.support.contact'), path: '/contact' }
      ]
    },
    {
      title: t('footer.legal.title'),
      links: [
        { label: t('footer.legal.terms'), path: '/terms' },
        { label: t('footer.legal.privacy'), path: '/privacy' },
        { label: t('footer.legal.cookies'), path: '/cookies' },
        { label: t('footer.legal.accessibility'), path: '/accessibility' }
      ]
    }
  ];

  const socialLinks = [
    { icon: <FacebookIcon />, url: 'https://facebook.com/zezman', label: 'Facebook' },
    { icon: <TwitterIcon />, url: 'https://twitter.com/zezman', label: 'Twitter' },
    { icon: <InstagramIcon />, url: 'https://instagram.com/zezman', label: 'Instagram' },
    { icon: <LinkedInIcon />, url: 'https://linkedin.com/company/zezman', label: 'LinkedIn' },
    { icon: <YouTubeIcon />, url: 'https://youtube.com/zezman', label: 'YouTube' }
  ];

  const contactInfo = [
    { icon: <EmailIcon />, text: 'info@zezman.com', action: 'mailto:info@zezman.com' },
    { icon: <PhoneIcon />, text: '+972-3-123-4567', action: 'tel:+972-3-123-4567' },
    { icon: <LocationIcon />, text: t('footer.contact.address'), action: null }
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.900',
        color: 'grey.100',
        mt: 'auto',
        pt: 6,
        pb: 3
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Zezman
            </Typography>
            <Typography variant="body2" color="grey.400" paragraph>
              {t('footer.description')}
            </Typography>
            
            {/* Social Media Links */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('footer.followUs')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    component="a"
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: 'grey.400',
                      '&:hover': {
                        color: 'primary.main',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>

            {/* Contact Info */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('footer.contact.title')}
              </Typography>
              {contactInfo.map((contact, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                    color: 'grey.400'
                  }}
                >
                  {contact.icon}
                  {contact.action ? (
                    <MuiLink
                      href={contact.action}
                      color="inherit"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {contact.text}
                    </MuiLink>
                  ) : (
                    <Typography variant="body2">
                      {contact.text}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <Typography variant="h6" component="h3" gutterBottom>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.links.map((link, linkIndex) => (
                  <Box component="li" key={linkIndex} sx={{ mb: 1 }}>
                    <MuiLink
                      component={Link}
                      to={link.path}
                      color="grey.400"
                      sx={{
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        '&:hover': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      {link.label}
                    </MuiLink>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.700' }} />

        {/* Bottom Footer */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 2 : 0
          }}
        >
          {/* Copyright */}
          <Typography variant="body2" color="grey.400">
            © {currentYear} Zezman. {t('footer.copyright')}
          </Typography>

          {/* Additional Links */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap'
            }}
          >
            <MuiLink
              component={Link}
              to="/sitemap"
              color="grey.400"
              sx={{
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {t('footer.sitemap')}
            </MuiLink>
            <MuiLink
              component={Link}
              to="/api"
              color="grey.400"
              sx={{
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {t('footer.api')}
            </MuiLink>
            <MuiLink
              component={Link}
              to="/status"
              color="grey.400"
              sx={{
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              {t('footer.status')}
            </MuiLink>
          </Box>
        </Box>

        {/* Language Notice */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="grey.500">
            {t('footer.languageNotice')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 