
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../organisms/Sidebar';
import { Bell, Search } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Toaster } from 'sonner';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Toaster position="top-right" richColors />
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between px-8">
          <div className="w-96 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </Button>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Arun Kumar</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold dark:bg-indigo-900/30 dark:border-indigo-800">
                AK
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
