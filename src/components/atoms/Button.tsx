
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-emerald-500 text-white hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 btn-3d',
    secondary: 'bg-gradient-to-r from-secondary to-indigo-500 text-white hover:from-secondary-dark hover:to-secondary shadow-lg shadow-secondary/20 hover:shadow-secondary/30 btn-3d',
    outline: 'border backdrop-blur-sm btn-outline-themed',
    ghost: 'btn-ghost-themed',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/20 btn-3d',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-6 py-3 text-lg',
    icon: 'h-10 w-10 p-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none gap-2 cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
