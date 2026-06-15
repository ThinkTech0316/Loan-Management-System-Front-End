
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}


export const Card: React.FC<CardProps> = ({ hoverable = true, className, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white text-slate-950 shadow-premium dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
        hoverable && 'transition-all duration-300 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
