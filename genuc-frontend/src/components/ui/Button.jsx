import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  iconLeft, 
  iconRight, 
  onClick, 
  type = 'button', 
  disabled = false,
  className = '',
  ...props 
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {iconLeft && <span className="btn-icon-left">{iconLeft}</span>}
      <span className="btn-label">{children}</span>
      {iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
};

export default Button;