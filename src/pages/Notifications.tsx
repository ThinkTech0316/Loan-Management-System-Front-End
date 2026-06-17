import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Wallet,
  Settings,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = React.useState([
    {
      id: '1',
      title: 'EMI Payment Received',
      message: '₹4,500 received from Rajesh Kumar for Loan #LN001',
      type: 'success',
      time: '10 mins ago',
      read: false,
    },
    {
      id: '2',
      title: 'Loan Overdue Alert',
      message: 'Suresh Menon missed the EMI payment for LN003 due yesterday.',
      type: 'error',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '3',
      title: 'New Loan Disbursed',
      message: '₹50,000 has been disbursed to Priya Sharma.',
      type: 'info',
      time: '1 day ago',
      read: true,
    },
    {
      id: '4',
      title: 'System Maintenance',
      message: 'Scheduled maintenance this Sunday from 2 AM to 4 AM.',
      type: 'warning',
      time: '2 days ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification removed');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <Wallet className="h-5 w-5 text-emerald-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-100 dark:bg-emerald-500/20';
      case 'error': return 'bg-red-100 dark:bg-red-500/20';
      case 'warning': return 'bg-amber-100 dark:bg-amber-500/20';
      default: return 'bg-blue-100 dark:bg-blue-500/20';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-slate-500 font-medium text-sm">Stay updated with system alerts and activities.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            {unreadCount === 0 ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L7 17l-5-5"/><path d="M22 10l-11 11"/></svg>}
            Mark all read
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-emerald-400" />
        
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-6 shadow-inner">
              <Bell className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">All caught up!</h3>
            <p className="text-slate-500 font-medium mt-2">You have no new notifications at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 relative z-10">
            {notifications.map((notification, index) => (
              <div 
                key={notification.id} 
                className={`p-5 flex gap-4 transition-all duration-300 group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${!notification.read ? 'bg-primary/5 dark:bg-primary/5' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-white/50 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform duration-300 ${getIconBg(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h4 className={`text-base font-bold truncate ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                      {notification.time}
                    </span>
                  </div>
                  <p className={`text-sm ${!notification.read ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500'}`}>
                    {notification.message}
                  </p>
                </div>
                
                <div className="flex flex-col items-end justify-between ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notification.read && (
                    <div className="h-2.5 w-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
