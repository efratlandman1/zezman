import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  error,
  helperText,
  disabled = false,
  required = false,
  fullWidth = false,
  size = 'medium',
  variant = 'outlined',
  startIcon,
  endIcon,
  className = '',
  ...props
}, ref) => {
  const { t } = useTranslation();

  const baseClasses = 'block w-full border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    outlined: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    filled: 'border-transparent bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
    underlined: 'border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${
            required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{startIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            ${baseClasses}
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${errorClasses}
            ${startIcon ? 'pl-10' : ''}
            ${endIcon ? 'pr-10' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{endIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyDown: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['outlined', 'filled', 'underlined']),
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string
};

Input.displayName = 'Input';

export default Input; 