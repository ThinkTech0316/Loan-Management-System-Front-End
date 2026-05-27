
import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Clock,
  MoreHorizontal
} from 'lucide-react';

const Notifications: React.FC = () => {
  const notifications = [
    {
      id: 1,
      title: 'Repayment Received',
      message: 'Anjali Kumar paid ₹4,500 for Loan #L1001',
      time: '2 mins ago',
      type: 'success',
      isUnread: true,
    },
    {
      id: 2,
      title: 'Loan Overdue',
      message: 'Loan #L1045 for Rajesh Raman is now 3 days overdue',
      time: '1 hour ago',
      type: 'error',
      isUnread: true,
    },
    {
      id: 3,
      title: 'New Borrower Registered',
      message: 'Priya Mani has completed her profile registration',
      time: '5 hours ago',
      type: 'info',
      isUnread: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white m-0">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with loan activities and collection alerts.</p>
        </div>
        <Button variant="outline" size="sm">Mark all as read</Button>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <Card key={n.id} className={`p-4 ${n.isUnread ? 'border-l-4 border-l-primary' : ''}`}>
            <div className="flex gap-4">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                n.type === 'error' ? 'bg-red-100 text-red-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {n.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                 n.type === 'error' ? <AlertCircle className="h-5 w-5" /> :
                 <Info className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white">{n.title}</h4>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {n.time}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{n.message}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-primary">View Detail</Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">Dismiss</Button>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
