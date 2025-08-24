import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = ({
  size = 'medium',
  variant = 'primary',
  text,
  fullScreen = false,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    success: 'text-green-600',
    danger: 'text-red-600'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`} {...props}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${variantClasses[variant]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={t('common.loading')}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      
      {text && (
        <p className="mt-2 text-sm text-gray-600">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'white', 'success', 'danger']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
  className: PropTypes.string
};

export default LoadingSpinner; 