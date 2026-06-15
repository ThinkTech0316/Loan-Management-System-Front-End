
import React from 'react';
import { Outlet } from 'react-router-dom';
import { HandCoins } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      {/* Left side: Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-12">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <HandCoins className="text-white h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Vanni<span className="text-primary">Loan</span>
            </span>
          </div>
          <Outlet />
        </div>
        
        <footer className="mt-12 text-center text-sm text-slate-500">
          &copy; 2026 VanniLoan Fintech Solutions. All rights reserved.
        </footer>
      </div>

      {/* Right side: Image/Marketing */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6 text-white leading-tight">
            The world's most modern <br/> loan management platform.
          </h2>
          <p className="text-emerald-50 text-lg mb-8 leading-relaxed">
            Empowering lenders with real-time analytics, automated collection workflows, and seamless borrower experiences.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <h4 className="text-2xl font-bold mb-1">99.9%</h4>
              <p className="text-emerald-100 text-sm">Collection Success</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <h4 className="text-2xl font-bold mb-1">2.4k</h4>
              <p className="text-emerald-100 text-sm">Active Lenders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
