import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', ...props }) => {
  const base = 'inline-block px-2 py-0.5 rounded text-xs font-medium';
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-200 text-gray-800',
  };
  return <span className={`${base} ${variants[variant]} ${className}`} {...props} />;
}; 