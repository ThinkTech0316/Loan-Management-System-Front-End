import React from 'react';
import { 
  Users, 
  HandCoins, 
  ArrowUpRight, 
  Calendar,
  AlertCircle,
  Clock,
  X
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white m-0">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button onClick={() => handleQuickAction('/reports')}>
            <ArrowUpRight className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Loans" 
          value={stats.totalActiveLoans} 
          icon={HandCoins} 
          trend={12} 
          trendLabel="vs last month"
          color="primary"
        />
        <StatCard 
          title="Outstanding Amount" 
          value={`₹${(stats.totalOutstanding).toLocaleString()}`} 
          icon={ArrowUpRight} 
          trend={8.4} 
          trendLabel="vs last month"
          color="secondary"
        />
        <StatCard 
          title="Total Collected" 
          value={`₹${(stats.totalCollected).toLocaleString()}`} 
          icon={Users} 
          trend={stats.monthlyGrowth} 
          trendLabel="vs last month"
          color="blue"
        />
        <StatCard 
          title="Overdue Loans" 
          value={stats.overdueCount} 
          icon={AlertCircle} 
          trend={-5.2} 
          trendLabel="vs last month"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Collection Performance</h3>
              <p className="text-sm text-slate-500">Expected vs Actual collections</p>
            </div>
            <Badge variant="info">Target: 95%</Badge>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="expected" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorExpected)" />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity / Quick Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex-col h-20 text-xs gap-2" onClick={() => handleQuickAction('/borrowers?add=true')}>
                <Users className="h-5 w-5 text-primary" />
                Add Borrower
              </Button>
              <Button variant="outline" className="flex-col h-20 text-xs gap-2" onClick={() => handleQuickAction('/loans?create=true')}>
                <HandCoins className="h-5 w-5 text-secondary" />
                Create Loan
              </Button>
              <Button variant="outline" className="flex-col h-20 text-xs gap-2" onClick={() => handleQuickAction('/repayments?record=true')}>
                <Clock className="h-5 w-5 text-amber-500" />
                Record EMI
              </Button>
              <Button variant="outline" className="flex-col h-20 text-xs gap-2" onClick={() => setIsScheduleOpen(true)}>
                <Calendar className="h-5 w-5 text-blue-500" />
                Schedule
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Repayments</h3>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleQuickAction('/repayments')}>View All</Button>
            </div>
            <div className="space-y-4">
              {recentRepayments.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-400">
                  No repayments recorded yet.
                </div>
              ) : (
                recentRepayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
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
                    <p className="text-sm font-bold text-emerald-600">₹{payment.amount.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Repayment Schedule Viewer Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">Repayment Schedule</h2>
                <p className="text-xs text-slate-500 mt-0.5">Amortization details and installment tracking</p>
              </div>
              <button 
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Select Loan for Schedule */}
              <div className="space-y-1.5 max-w-sm">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Loan Agreement
                </label>
                {loans.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                    No active loan agreements found.
                  </div>
                ) : (
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                  >
                    {loans.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.id} - {l.borrowerName} (₹{l.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Loan Details Quick Card */}
              {selectedLoanDetails && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Borrower Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLoanDetails.borrowerName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Loan Principal</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">₹{selectedLoanDetails.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Outstanding</span>
                    <span className="font-semibold text-amber-600">₹{selectedLoanDetails.remainingBalance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Interest Rate</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLoanDetails.interestRate}% p.a.</span>
                  </div>
                </div>
              )}

              {/* Installments Table */}
              <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="max-h-[250px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-150 dark:border-slate-800 sticky top-0 backdrop-blur-xs">
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
                          <tr key={inst.installmentNumber} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-slate-500 font-medium">#{inst.installmentNumber}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                              {new Date(inst.dueDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              ₹{inst.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">₹{inst.principal.toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">₹{inst.interest.toLocaleString()}</td>
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
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" onClick={() => setIsScheduleOpen(false)}>
                  Close Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
