import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Loader({ size = 'lg', className = '' }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <img 
      src="/icon.png" 
      alt="Loading" 
      className={`${sizeClasses[size]} animate-pulse rounded-full ${className}`} 
    />
  );
}
