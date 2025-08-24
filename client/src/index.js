import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';

import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Import app components
import App from './App';

// Import store
import { store } from './redux/store';

// Import internationalization
import './i18n';

// Import global styles
import './styles/global.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Hide the HTML loading spinner
const hideLoadingSpinner = () => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
  document.body.classList.add('app-loaded');
};

// Render app
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <BrowserRouter>
            <CssBaseline />
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 6000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </BrowserRouter>
        </HelmetProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

// Hide loading spinner after app renders
setTimeout(hideLoadingSpinner, 100); 