import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-lg',
    glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-xl',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-6 transition-all duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};