
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
  Menu
} from 'lucide-react';
import { SidebarItem } from '../molecules/SidebarItem';
import { Button } from '../atoms/Button';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside 
      className={`h-screen border-r border-slate-200 bg-white transition-all duration-300 flex flex-col dark:bg-slate-900 dark:border-slate-800 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <HandCoins className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Vanni<span className="text-primary">Loan</span>
            </span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <SidebarItem icon={LayoutDashboard} label={isCollapsed ? "" : "Dashboard"} to="/" />
        <SidebarItem icon={Users} label={isCollapsed ? "" : "Borrowers"} to="/borrowers" />
        <SidebarItem icon={HandCoins} label={isCollapsed ? "" : "Loans"} to="/loans" />
        <SidebarItem icon={Wallet} label={isCollapsed ? "" : "Repayments"} to="/repayments" />
        <SidebarItem icon={BarChart3} label={isCollapsed ? "" : "Reports"} to="/reports" />
        <SidebarItem icon={Bell} label={isCollapsed ? "" : "Notifications"} to="/notifications" />
        <SidebarItem icon={Settings} label={isCollapsed ? "" : "Settings"} to="/settings" />
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-500">
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
};
