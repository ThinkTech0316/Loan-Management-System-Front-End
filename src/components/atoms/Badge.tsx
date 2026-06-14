
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, children, ...props }) => {
  const variants = {
    success: 'bg-gradient-to-r from-emerald-50 to-emerald-100/80 text-emerald-700 border border-emerald-200/50 dark:from-emerald-950/40 dark:to-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30',
    warning: 'bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-700 border border-amber-200/50 dark:from-amber-950/40 dark:to-amber-900/30 dark:text-amber-400 dark:border-amber-800/30',
    error: 'bg-gradient-to-r from-red-50 to-red-100/80 text-red-700 border border-red-200/50 dark:from-red-950/40 dark:to-red-900/30 dark:text-red-400 dark:border-red-800/30',
    info: 'bg-gradient-to-r from-indigo-50 to-indigo-100/80 text-indigo-700 border border-indigo-200/50 dark:from-indigo-950/40 dark:to-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/30',
    neutral: 'bg-gradient-to-r from-slate-50 to-slate-100/80 text-slate-700 border border-slate-200/50 dark:from-slate-800/60 dark:to-slate-800/40 dark:text-slate-400 dark:border-slate-700/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 backdrop-blur-sm uppercase',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
