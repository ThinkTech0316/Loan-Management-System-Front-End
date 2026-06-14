
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
}


export const Card: React.FC<CardProps> = ({ hoverable = true, glass = false, className, children, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border relative overflow-hidden',
        glass && 'glass-card',
        !glass && 'shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_2px_10px_-2px_rgba(0,0,0,0.02)]',
        hoverable && 'transition-all duration-400 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-0.5',
        className
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
        color: 'var(--color-body)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};
