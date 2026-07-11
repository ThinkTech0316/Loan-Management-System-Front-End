
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../organisms/Sidebar';
import { Bell, Search, Menu, LogOut } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Toaster } from 'sonner';
import { ThemeToggle } from '../atoms/ThemeToggle';
import { useBranding } from '../../contexts/BrandingContext';
import { apiService } from '../../services/api';

export const DashboardLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const { systemName } = useBranding();
  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);
  const [profileName, setProfileName] = React.useState('Admin');

  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('tenant_id');
    window.location.href = '/login';
  };

  React.useEffect(() => {
    apiService.getSetting('profile').then((data: any) => {
      if (data?.profilePhoto) setProfilePhoto(data.profilePhoto);
      const name = [data?.firstName, data?.lastName].filter(Boolean).join(' ');
      if (name) setProfileName(name);
    }).catch(() => {});
  }, []);

  const initials = React.useMemo(() => {
    return profileName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || 'A';
  }, [profileName]);

  return (
    <div className="flex h-screen w-full overflow-hidden mesh-gradient" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}>
      <Toaster position="top-right" richColors />
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with glassmorphism */}
        <header className="h-16 border-b backdrop-blur-xl flex items-center justify-between px-4 md:px-8 relative z-30" style={{ backgroundColor: 'var(--color-header-bg)', borderColor: 'var(--color-divider)' }}>
          {/* Subtle gradient line on top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="flex items-center gap-3 md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileOpen(true)}
              className="hover:bg-primary/5 hover:text-primary transition-all duration-300"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-bold font-display" style={{ color: 'var(--color-heading)' }}>{systemName}</span>
          </div>

          <div className="w-96 hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 group-focus-within:text-primary transition-colors duration-300" style={{ color: 'var(--color-faint)' }} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all duration-300 backdrop-blur-sm"
                style={{
                  backgroundColor: 'var(--color-input-bg)',
                  borderColor: 'var(--color-divider)',
                  color: 'var(--color-foreground)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />



            <Button variant="ghost" size="icon" className="relative hover:bg-primary/5" onClick={() => navigate('/notifications')}>
              <Bell className="h-5 w-5" style={{ color: 'var(--color-subtle)' }} />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 animate-pulse" style={{ borderColor: 'var(--color-surface)' }}></span>
            </Button>
            
            <div className="h-8 w-[1px] mx-1" style={{ background: 'linear-gradient(to bottom, transparent, var(--color-divider), transparent)' }}></div>
            
            <div className="flex items-center gap-2 md:gap-3 group cursor-pointer ml-2 md:ml-0 relative">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold" style={{ color: 'var(--color-heading)' }}>{profileName}</p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-subtle)' }}>Administrator</p>
              </div>
              <div onClick={() => setShowUserMenu(!showUserMenu)}>
                {profilePhoto ? (
                  <img src={profilePhoto.startsWith('/uploads') ? `/api${profilePhoto}` : profilePhoto} alt={profileName} className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105 cursor-pointer" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105 cursor-pointer">
                    {initials}
                  </div>
                )}
              </div>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border shadow-xl py-2 animate-scale-in" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content with 3D animated moving background */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {/* 3D Animated Background Orbs */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] animate-morph-blob opacity-70" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-morph-blob opacity-70" style={{ animationDelay: '2s', animationDuration: '12s' }} />
            <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-amber-500/10 rounded-full blur-[150px] animate-morph-blob opacity-50" style={{ animationDelay: '4s', animationDuration: '15s' }} />
            
            {/* Overlay Grid for depth */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
