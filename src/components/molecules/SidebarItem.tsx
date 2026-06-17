
import React from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  color?: 'primary' | 'secondary' | 'amber' | 'blue' | 'red';
}

const colorClasses = {
  primary: {
    active: 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary border-l-2 border-l-primary',
    iconActive: 'bg-primary/15 text-primary shadow-sm shadow-primary/20',
    iconIdle: 'text-[var(--color-faint)] group-hover:bg-primary/10 group-hover:text-primary',
  },
  secondary: {
    active: 'bg-gradient-to-r from-secondary/15 to-secondary/5 text-secondary border-l-2 border-l-secondary',
    iconActive: 'bg-secondary/15 text-secondary shadow-sm shadow-secondary/20',
    iconIdle: 'text-[var(--color-faint)] group-hover:bg-secondary/10 group-hover:text-secondary',
  },
  amber: {
    active: 'bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-600 border-l-2 border-l-amber-500',
    iconActive: 'bg-amber-500/15 text-amber-600 shadow-sm shadow-amber-500/20',
    iconIdle: 'text-[var(--color-faint)] group-hover:bg-amber-500/10 group-hover:text-amber-600',
  },
  blue: {
    active: 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-600 border-l-2 border-l-blue-500',
    iconActive: 'bg-blue-500/15 text-blue-600 shadow-sm shadow-blue-500/20',
    iconIdle: 'text-[var(--color-faint)] group-hover:bg-blue-500/10 group-hover:text-blue-600',
  },
  red: {
    active: 'bg-gradient-to-r from-red-500/15 to-red-500/5 text-red-600 border-l-2 border-l-red-500',
    iconActive: 'bg-red-500/15 text-red-600 shadow-sm shadow-red-500/20',
    iconIdle: 'text-[var(--color-faint)] group-hover:bg-red-500/10 group-hover:text-red-600',
  },
};

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, to, color = 'primary' }) => {
  const colors = colorClasses[color];

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative animate-slide-in-up',
          isActive
            ? `${colors.active} font-semibold`
            : 'hover:bg-[var(--color-surface-hover)]'
        )
      }
      style={({ isActive }) => isActive ? {} : { color: 'var(--color-subtle)' }}
    >
      {({ isActive }) => (
        <>
          <div 
            className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300',
              isActive ? colors.iconActive : colors.iconIdle
            )}
            style={isActive ? {} : { backgroundColor: 'var(--color-surface-secondary)' }}
          >
            <Icon className="h-4 w-4" />
          </div>
          {label && <span className="text-sm font-medium">{label}</span>}
          {isActive && (
            <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );
};
