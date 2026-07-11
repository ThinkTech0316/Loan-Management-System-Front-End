
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  HandCoins, 
  Wallet, 
  BarChart3, 
  Settings, 
  Bell,
  LogOut,
  ChevronLeft,
  Menu,
  Sparkles,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { SidebarItem } from '../molecules/SidebarItem';
import { Button } from '../atoms/Button';
import { useNavigate } from 'react-router-dom';
import { useBranding } from '../../contexts/BrandingContext';
import { useConfirm } from '../../hooks/useConfirm';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const navigate = useNavigate();
  const { systemName, logoColor, logoUrl } = useBranding();
  const { confirm, ConfirmDialog } = useConfirm();

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [window.location.pathname]);

  const handleLogout = async () => {
    if (await confirm('Are you sure you want to sign out?')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('tenant_id');
      navigate('/login');
    }
  };

  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <>
      <ConfirmDialog />
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 h-screen border-r backdrop-blur-xl transition-all duration-500 ease-out flex flex-col
          ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
          ${!mobileOpen && isCollapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
        style={{
          backgroundColor: 'var(--color-sidebar-bg)',
          borderColor: 'var(--color-divider)',
        }}
      >
      {/* Animated gradient accent on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-secondary to-primary bg-[length:100%_200%] animate-shimmer" />
      
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-breathe pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl animate-breathe pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="p-5 flex items-center justify-between relative z-10">
        {!isCollapsed && (
          <div className="flex items-center gap-3 animate-fade-in-right">
            <div className={`icon-3d icon-3d-${logoColor} h-10 w-10 flex items-center justify-center overflow-hidden animate-float-slow`}>
              {logoUrl ? (
                <img src={logoUrl.startsWith('/uploads') ? `/api${logoUrl}` : logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <HandCoins className="text-white h-5 w-5 relative z-10" />
              )}
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight font-display" style={{ color: 'var(--color-heading)' }}>
                {systemName}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-faint)' }}>
                <Sparkles className="h-3 w-3 text-amber-400" />
                Premium Suite
              </span>
            </div>
          </div>
        )}
        <div className="hidden lg:block">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-primary/5 hover:text-primary transition-all duration-300"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Mobile close button */}
        <div className="lg:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileOpen(false)}
            className="hover:bg-primary/5 hover:text-primary transition-all duration-300"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-5 mb-2">
          <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--color-divider), transparent)' }} />
        </div>
      )}

      <nav className="flex-1 px-3 space-y-1 relative z-10 stagger-children overflow-y-auto">
        {!isSuperAdmin && (
          <>
            <SidebarItem icon={LayoutDashboard} label={isCollapsed ? "" : "Dashboard"} to="/" color="primary" />
            <SidebarItem icon={Users} label={isCollapsed ? "" : "Borrowers"} to="/borrowers" color="blue" />
            <SidebarItem icon={HandCoins} label={isCollapsed ? "" : "Loans"} to="/loans" color="secondary" />
            <SidebarItem icon={ShieldCheck} label={isCollapsed ? "" : "Fixed Deposits"} to="/fixed-deposits" color="primary" />
            <SidebarItem icon={Wallet} label={isCollapsed ? "" : "Repayments"} to="/repayments" color="amber" />
            <SidebarItem icon={BarChart3} label={isCollapsed ? "" : "Reports"} to="/reports" color="primary" />
          </>
        )}
        <SidebarItem icon={Bell} label={isCollapsed ? "" : "Notifications"} to="/notifications" color="red" />
        <SidebarItem icon={Settings} label={isCollapsed ? "" : "Settings"} to="/settings" color="secondary" />
        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-faint)' }}>Admin</p>
            </div>
            <SidebarItem icon={ShieldAlert} label={isCollapsed ? "" : "Staff Management"} to="/staff" color="amber" />
          </>
        )}
      </nav>

      {!isCollapsed && (
        <div className="px-5 mb-2">
          <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, var(--color-divider), transparent)' }} />
        </div>
      )}

      <div className="p-3 relative z-10">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start hover:text-red-500 hover:bg-red-50 transition-all duration-300 group"
          style={{ color: 'var(--color-faint)' }}
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors duration-300" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <LogOut className="h-4 w-4" />
          </div>
          {!isCollapsed && <span className="ml-2 text-sm font-medium">Sign Out</span>}
        </Button>
      </div>
    </aside>
    </>
  );
};
