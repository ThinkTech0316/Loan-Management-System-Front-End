
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'secondary' | 'amber' | 'blue' | 'emerald' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendLabel,
  color = 'primary' 
}) => {
  const iconClassMap = {
    primary: 'icon-3d-primary',
    secondary: 'icon-3d-secondary',
    amber: 'icon-3d-amber',
    blue: 'icon-3d-blue',
    emerald: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    indigo: 'bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.5)]',
  };

  const glowMap = {
    primary: 'hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)]',
    secondary: 'hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)]',
    amber: 'hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)]',
    blue: 'hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)]',
    emerald: 'hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)]',
    indigo: 'hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)]',
  };

  const accentLineMap = {
    primary: 'from-primary to-emerald-400',
    secondary: 'from-secondary to-indigo-400',
    amber: 'from-amber-500 to-yellow-400',
    blue: 'from-blue-500 to-cyan-400',
    emerald: 'from-emerald-500 to-teal-400',
    indigo: 'from-indigo-500 to-purple-400',
  };

  return (
    <div className={`glass-card card-3d rounded-2xl p-6 relative overflow-hidden group ${glowMap[color]} animate-slide-in-up`}>
      {/* Top accent gradient line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${accentLineMap[color]} opacity-80`} />
      
      {/* Background decoration */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-current/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className={`${['emerald', 'indigo'].includes(color) ? `rounded-xl flex items-center justify-center` : 'icon-3d'} ${iconClassMap[color]} h-12 w-12 group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="h-5 w-5 text-white relative z-10" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${
            trend >= 0 
              ? 'text-emerald-600 bg-emerald-50/80' 
              : 'text-red-600 bg-red-50/80'
          }`}>
            {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium" style={{ color: 'var(--color-subtle)' }}>{title}</p>
        <h3 className="text-3xl font-extrabold mt-1.5 tracking-tight font-display" style={{ color: 'var(--color-heading)' }}>
          {value}
        </h3>
        {trendLabel && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--color-faint)' }}>
            <span className="inline-block h-1 w-1 rounded-full" style={{ backgroundColor: 'var(--color-faint)' }} />
            {trendLabel}
          </p>
        )}
      </div>
    </div>
  );
};
