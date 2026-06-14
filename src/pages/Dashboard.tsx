import React from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  HandCoins, 
  Calendar,
  AlertCircle,
  Clock,
  X,
  Sparkles,
  TrendingUp,
  Wallet,
  Activity,
  ShieldCheck,
  PiggyBank
} from 'lucide-react';
import { StatCard } from '../components/molecules/StatCard';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge.tsx';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { apiService, type Installment } from '../services/mockApi';
import type { DashboardStats, CollectionData, Loan, Repayment } from '../types';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [chartData, setChartData] = React.useState<CollectionData[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [recentRepayments, setRecentRepayments] = React.useState<Repayment[]>([]);
  const navigate = useNavigate();

  // Schedule Modal State
  const [isScheduleOpen, setIsScheduleOpen] = React.useState(false);
  const [selectedLoanId, setSelectedLoanId] = React.useState('');
  const [scheduleInstallments, setScheduleInstallments] = React.useState<Installment[]>([]);

  const fetchDashboardData = React.useCallback(async () => {
    const fetchedStats = await apiService.getStats();
    const fetchedChartData = await apiService.getCollectionData();
    const fetchedLoans = await apiService.getLoans();
    const fetchedRepayments = await apiService.getRepayments();

    setStats(fetchedStats);
    setChartData(fetchedChartData);
    setLoans(fetchedLoans);
    setRecentRepayments(fetchedRepayments.slice(0, 3));

    if (fetchedLoans.length > 0 && !selectedLoanId) {
      setSelectedLoanId(fetchedLoans[0].id);
    }
  }, [selectedLoanId]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Load amortization schedule whenever selected loan changes
  React.useEffect(() => {
    if (selectedLoanId) {
      apiService.getRepaymentSchedule(selectedLoanId).then(setScheduleInstallments);
    } else {
      setScheduleInstallments([]);
    }
  }, [selectedLoanId]);

  if (!stats) return null;

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  const selectedLoanDetails = loans.find(l => l.id === selectedLoanId);

  return (
    <div className="space-y-8">
      {/* Header with gradient text */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Dashboard
            </h1>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              <Activity className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex-1 sm:flex-none">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button onClick={() => handleQuickAction('/reports')} className="flex-1 sm:flex-none">
            <Sparkles className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards with staggered animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
        <div className="animate-slide-in-up hover:-translate-y-1 transition-transform duration-300">
          <StatCard 
            title="Active Loans" 
            value={stats.totalActiveLoans} 
            icon={HandCoins} 
            trend={12} 
            trendLabel="vs last month"
            color="primary"
          />
        </div>
        <div className="animate-slide-in-up hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: '50ms' }}>
          <StatCard 
            title="Active FDs" 
            value={stats.totalActiveFDs} 
            icon={ShieldCheck} 
            trend={5} 
            trendLabel="vs last month"
            color="emerald"
          />
        </div>
        <div className="animate-slide-in-up hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: '100ms' }}>
          <StatCard 
            title="Outstanding Loans" 
            value={`Rs. ${(stats.totalOutstanding).toLocaleString()}`} 
            icon={Wallet} 
            trend={8.4} 
            trendLabel="vs last month"
            color="secondary"
          />
        </div>
        <div className="animate-slide-in-up hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: '150ms' }}>
          <StatCard 
            title="Total FD Deposits" 
            value={`Rs. ${(stats.totalDeposits).toLocaleString()}`} 
            icon={PiggyBank} 
            trend={10.2} 
            trendLabel="vs last month"
            color="indigo"
          />
        </div>
        <div className="animate-slide-in-up hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: '200ms' }}>
          <StatCard 
            title="Total Collected" 
            value={`Rs. ${(stats.totalCollected).toLocaleString()}`} 
            icon={TrendingUp} 
            trend={stats.monthlyGrowth} 
            trendLabel="vs last month"
            color="blue"
          />
        </div>
        <div className="animate-slide-in-up hover:-translate-y-1 transition-transform duration-300" style={{ animationDelay: '250ms' }}>
          <StatCard 
            title="Overdue Loans" 
            value={stats.overdueCount} 
            icon={AlertCircle} 
            trend={-5.2} 
            trendLabel="vs last month"
            color="amber"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Chart with glassmorphism */}
        <Card className="lg:col-span-2 p-6 animate-slide-in-up" style={{ animationDelay: '200ms' }}>
          {/* Accent line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary via-primary to-amber-400 rounded-t-2xl" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Collection Performance</h3>
              <p className="text-sm text-slate-500">Expected vs Actual collections</p>
            </div>
            <Badge variant="info">
              <Sparkles className="h-3 w-3 mr-1" />
              Target: 95%
            </Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `Rs. ${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15)', backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.95)' }}
                  formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="expected" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorExpected)" dot={false} />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-secondary" />
              <span className="text-xs font-medium text-slate-500">Expected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-xs font-medium text-slate-500">Actual</span>
            </div>
          </div>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions with 3D icon buttons */}
          <Card className="p-6 animate-slide-in-up" style={{ animationDelay: '300ms' }}>
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary rounded-t-2xl" />
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white font-display">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleQuickAction('/borrowers?add=true')}
                className="flex flex-col items-center justify-center gap-2.5 h-24 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="icon-3d icon-3d-primary h-9 w-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-4 w-4 text-white relative z-10" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Add Borrower</span>
              </button>
              <button 
                onClick={() => handleQuickAction('/loans?create=true')}
                className="flex flex-col items-center justify-center gap-2.5 h-24 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60 hover:border-secondary/30 hover:bg-secondary/5 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-secondary/5"
              >
                <div className="icon-3d icon-3d-secondary h-9 w-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <HandCoins className="h-4 w-4 text-white relative z-10" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Create Loan</span>
              </button>
              <button 
                onClick={() => handleQuickAction('/repayments?record=true')}
                className="flex flex-col items-center justify-center gap-2.5 h-24 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60 hover:border-amber-500/30 hover:bg-amber-50 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div className="icon-3d icon-3d-amber h-9 w-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-4 w-4 text-white relative z-10" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Record EMI</span>
              </button>
              <button 
                onClick={() => setIsScheduleOpen(true)}
                className="flex flex-col items-center justify-center gap-2.5 h-24 rounded-xl border border-slate-200/60 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/60 hover:border-blue-500/30 hover:bg-blue-50 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="icon-3d icon-3d-blue h-9 w-9 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-4 w-4 text-white relative z-10" />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Schedule</span>
              </button>
            </div>
          </Card>

          {/* Recent Repayments */}
          <Card className="p-6 animate-slide-in-up hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden" style={{ animationDelay: '400ms' }}>
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-primary rounded-t-2xl" />
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Recent Repayments</h3>
              <Button variant="ghost" size="sm" className="text-primary font-semibold" onClick={() => handleQuickAction('/repayments')}>View All</Button>
            </div>
            <div className="space-y-3">
              {recentRepayments.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                    <Wallet className="h-6 w-6 text-slate-400" />
                  </div>
                  No repayments recorded yet.
                </div>
              ) : (
                recentRepayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:scale-105 transition-transform duration-300">
                        {payment.loanId}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Loan Ref: {payment.loanId}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {payment.method.replace('_', ' ')} • {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-extrabold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Rs. {payment.amount.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Repayment Schedule Viewer Modal */}
      {isScheduleOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-secondary to-amber-400" />
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Repayment Schedule</h2>
                <p className="text-xs text-slate-500 mt-0.5">Amortization details and installment tracking</p>
              </div>
              <button 
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              
              {/* Select Loan for Schedule */}
              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Select Loan Agreement
                </label>
                {loans.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                    No active loan agreements found.
                  </div>
                ) : (
                  <select
                    className="flex h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 transition-all duration-300"
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                  >
                    {loans.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.id} - {l.borrowerName} (Rs. {l.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Loan Details Quick Card */}
              {selectedLoanDetails && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 glass-card rounded-xl p-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Borrower Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLoanDetails.borrowerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Loan Principal</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Rs. {selectedLoanDetails.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Outstanding</span>
                    <span className="font-bold text-amber-600">Rs. {selectedLoanDetails.remainingBalance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-medium">Interest Rate</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLoanDetails.interestRate}% p.a.</span>
                  </div>
                </div>
              )}

              {/* Installments Table */}
              <div className="border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 backdrop-blur-sm z-10">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">No.</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Principal</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Interest</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {scheduleInstallments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            No installments found.
                          </td>
                        </tr>
                      ) : (
                        scheduleInstallments.map((inst) => (
                          <tr key={inst.installmentNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-500 font-medium">#{inst.installmentNumber}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                              {new Date(inst.dueDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              Rs. {inst.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Rs. {inst.principal.toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">Rs. {inst.interest.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={
                                  inst.status === 'paid' 
                                    ? 'success' 
                                    : inst.status === 'overdue' 
                                      ? 'error' 
                                      : 'warning'
                                }
                              >
                                {inst.status.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <Button type="button" onClick={() => setIsScheduleOpen(false)}>
                  Close Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
