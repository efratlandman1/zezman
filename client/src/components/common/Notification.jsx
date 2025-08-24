import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const Notification = ({
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  onAction,
  actionText,
  persistent = false,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const typeConfig = {
    success: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      classes: 'bg-green-50 border-green-200 text-green-800'
    },
    error: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
      classes: 'bg-red-50 border-red-200 text-red-800'
    },
    warning: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      classes: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    info: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      classes: 'bg-blue-50 border-blue-200 text-blue-800'
    }
  };

  const config = typeConfig[type];

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, persistent]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className={`
        border rounded-lg p-4 shadow-lg
        ${config.classes}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h3 className="text-sm font-medium">
                {title}
              </h3>
            )}
            
            {message && (
              <p className="mt-1 text-sm">
                {message}
              </p>
            )}
            
            {onAction && actionText && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleAction}
                  className="text-sm font-medium hover:underline focus:outline-none focus:underline"
                >
                  {actionText}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${type === 'success' ? 'hover:bg-green-100 focus:ring-green-500' : ''}
                ${type === 'error' ? 'hover:bg-red-100 focus:ring-red-500' : ''}
                ${type === 'warning' ? 'hover:bg-yellow-100 focus:ring-yellow-500' : ''}
                ${type === 'info' ? 'hover:bg-blue-100 focus:ring-blue-500' : ''}
              `}
              aria-label={t('common.close')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Notification.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  title: PropTypes.string,
  message: PropTypes.string,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  onAction: PropTypes.func,
  actionText: PropTypes.string,
  persistent: PropTypes.bool,
  className: PropTypes.string
};

export default Notification; 