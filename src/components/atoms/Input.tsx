
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label style={{ color: 'var(--color-body)' }} className="text-sm font-semibold tracking-wide">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          className={cn(
            'flex h-11 w-full rounded-xl border px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm',
            error && 'border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-500',
            className
          )}
          style={{
            backgroundColor: 'var(--color-input-bg)',
            borderColor: error ? undefined : 'var(--color-divider)',
            color: 'var(--color-foreground)',
          }}
          {...props}
        />
        {/* Focus glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-sm" />
      </div>
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1a5 5 0 100 10A5 5 0 006 1zM5.5 3.5h1v3h-1v-3zm0 4h1v1h-1v-1z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
