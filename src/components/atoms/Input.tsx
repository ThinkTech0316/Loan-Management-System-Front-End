import React, { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="w-full space-y-2">
      {label && (
        <label style={{ color: 'var(--color-body)' }} className="text-sm font-semibold tracking-wide">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={cn(
            'flex h-11 w-full rounded-xl border px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm',
            error && 'border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-500',
            isPassword && 'pr-10', // Add padding for the eye icon
            className
          )}
          style={{
            backgroundColor: 'var(--color-input-bg)',
            borderColor: error ? undefined : 'var(--color-divider)',
            color: 'var(--color-foreground)',
          }}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}

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
