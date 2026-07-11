
import React from 'react';
import { Outlet } from 'react-router-dom';
import { HandCoins, Shield, Zap, BarChart3, Sparkles } from 'lucide-react';
import { useBranding } from '../../contexts/BrandingContext';

export const AuthLayout: React.FC = () => {
  const { systemName, logoColor, logoUrl } = useBranding();

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950">
      {/* Left side: Content */}
      <div className="flex flex-col justify-center items-center p-8 md:p-12 relative overflow-y-auto w-full max-w-full">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-breathe pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-secondary/5 rounded-full blur-3xl animate-breathe pointer-events-none" style={{ animationDelay: '2s' }} />
        
        <div className="w-full max-w-md relative z-10 my-auto">
          <div className="flex items-center gap-3 mb-12 animate-slide-in-up">
            <div className={`icon-3d icon-3d-${logoColor} h-12 w-12 flex items-center justify-center overflow-hidden animate-float-slow shrink-0`}>
              {logoUrl ? (
                <img src={logoUrl.startsWith('/uploads') ? `/api${logoUrl}` : logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <HandCoins className="text-white h-6 w-6 relative z-10" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display block truncate">
                {systemName}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate">
                <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                Financial Suite
              </span>
            </div>
          </div>
          <Outlet />
        </div>
        
        <footer className="mt-12 text-center text-sm text-slate-400 font-medium pb-8">
          &copy; {new Date().getFullYear()} {systemName} Fintech Solutions. All rights reserved.
        </footer>
      </div>

      {/* Right side: Immersive 3D showcase */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-full">
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-breathe pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/20 rounded-full blur-[100px] animate-breathe pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-breathe pointer-events-none" style={{ animationDelay: '4s' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 text-white max-w-lg">
          <div className="flex items-center gap-2 mb-8 animate-slide-in-up">
            <div className="h-1 w-12 bg-gradient-to-r from-primary to-transparent rounded-full" />
            <span className="text-xs font-bold text-primary uppercase tracking-[3px]">Fintech Platform</span>
          </div>
          
          <h2 className="text-5xl font-extrabold mb-6 text-white leading-[1.15] tracking-tight font-display animate-slide-in-up" style={{ animationDelay: '100ms' }}>
            The world's most <br/>
            <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-300 bg-clip-text text-transparent">
              modern loan
            </span>
            <br/>management platform.
          </h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed animate-slide-in-up" style={{ animationDelay: '200ms' }}>
            Empowering lenders with real-time analytics, automated collection workflows, and seamless borrower experiences.
          </p>
          
          {/* 3D Feature Cards */}
          <div className="grid grid-cols-2 gap-4 stagger-children">
            <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 animate-slide-in-up">
              <div className="icon-3d icon-3d-primary h-10 w-10 flex items-center justify-center mb-3">
                <Shield className="h-5 w-5 text-white relative z-10" />
              </div>
              <h4 className="text-lg font-bold mb-0.5 text-white">99.9%</h4>
              <p className="text-slate-400 text-xs font-medium">Collection Success Rate</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 animate-slide-in-up">
              <div className="icon-3d icon-3d-secondary h-10 w-10 flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-white relative z-10" />
              </div>
              <h4 className="text-lg font-bold mb-0.5 text-white">2.4k+</h4>
              <p className="text-slate-400 text-xs font-medium">Active Lenders</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 animate-slide-in-up">
              <div className="icon-3d icon-3d-amber h-10 w-10 flex items-center justify-center mb-3">
                <BarChart3 className="h-5 w-5 text-white relative z-10" />
              </div>
              <h4 className="text-lg font-bold mb-0.5 text-white">Rs. 500M+</h4>
              <p className="text-slate-400 text-xs font-medium">Portfolio Managed</p>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md group hover:bg-white/10 transition-all duration-500 animate-slide-in-up">
              <div className="icon-3d icon-3d-blue h-10 w-10 flex items-center justify-center mb-3">
                <HandCoins className="h-5 w-5 text-white relative z-10" />
              </div>
              <h4 className="text-lg font-bold mb-0.5 text-white">0.1%</h4>
              <p className="text-slate-400 text-xs font-medium">Default Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
