import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge.tsx';
import { Input } from '../components/atoms/Input';
import { 
  Plus, 
  MoreVertical, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { apiService } from '../services/mockApi';
import type { Loan, Borrower } from '../types';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const Loans: React.FC = () => {
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Form State
  const [borrowerId, setBorrowerId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [interestRate, setInterestRate] = React.useState('12');
  const [durationMonths, setDurationMonths] = React.useState('12');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [repaymentFrequency, setRepaymentFrequency] = React.useState<'weekly' | 'monthly'>('monthly');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isCreateModalOpen = searchParams.get('create') === 'true';

  const fetchData = React.useCallback(async () => {
    try {
      const fetchedLoans = await apiService.getLoans();
      const fetchedBorrowers = await apiService.getBorrowers();
      setLoans(fetchedLoans);
      setBorrowers(fetchedBorrowers);
      if (fetchedBorrowers.length > 0 && !borrowerId) {
        setBorrowerId(fetchedBorrowers[0].id);
      }
    } catch (e) {
      toast.error('Failed to load active loans or borrowers data.');
    }
  }, [borrowerId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = () => {
    setSearchParams({ create: 'true' });
  };

  const handleCloseModal = () => {
    searchParams.delete('create');
    setSearchParams(searchParams);
    setAmount('');
    setInterestRate('12');
    setDurationMonths('12');
    setStartDate(new Date().toISOString().split('T')[0]);
    setRepaymentFrequency('monthly');
    setErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!borrowerId) newErrors.borrowerId = 'Please select a borrower';
    
    const amtNum = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amtNum) || amtNum <= 0) {
      newErrors.amount = 'Please enter a valid loan amount';
    }

    const rateNum = parseFloat(interestRate);
    if (!interestRate.trim()) {
      newErrors.interestRate = 'Interest rate is required';
    } else if (isNaN(rateNum) || rateNum < 0) {
      newErrors.interestRate = 'Interest rate must be a positive number';
    }

    const durNum = parseInt(durationMonths);
    if (!durationMonths.trim()) {
      newErrors.durationMonths = 'Duration is required';
    } else if (isNaN(durNum) || durNum <= 0) {
      newErrors.durationMonths = 'Duration must be greater than 0';
    }

    if (!startDate) newErrors.startDate = 'Start date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createLoan({
        borrowerId,
        amount: amtNum,
        interestRate: rateNum,
        durationMonths: durNum,
        startDate,
        repaymentFrequency,
      });
      toast.success('New loan agreement has been successfully created!');
      handleCloseModal();
      fetchData();
    } catch (e) {
      toast.error('Failed to create loan agreement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real-time EMI Estimator
  const estimatedEmi = React.useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const rate = (parseFloat(interestRate) || 0) / 12 / 100;
    const mos = parseInt(durationMonths) || 0;
    if (amt <= 0 || mos <= 0) return 0;
    if (rate === 0) return amt / mos;
    return Math.round((amt * rate * Math.pow(1 + rate, mos)) / (Math.pow(1 + rate, mos) - 1));
  }, [amount, interestRate, durationMonths]);

  const getStatusVariant = (status: Loan['status']): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (status) {
      case 'active': return 'info';
      case 'completed': return 'success';
      case 'overdue': return 'error';
      case 'pending': return 'warning';
      default: return 'neutral';
    }
  };

  const getStatusIcon = (status: Loan['status']) => {
    switch (status) {
      case 'active': return <Clock className="h-3 w-3 mr-1" />;
      case 'completed': return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'overdue': return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'pending': return <Clock className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  // Calculated Portfolio Cards
  const totalDisbursed = loans.reduce((sum, l) => sum + l.amount, 0);
  const activePrincipal = loans.reduce((sum, l) => l.status !== 'completed' ? sum + l.remainingBalance : sum, 0);
  const totalInterestEarned = loans.reduce((sum, l) => sum + (l.amount * (l.interestRate / 100) * (l.durationMonths / 12)), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white m-0">Loans</h1>
          <p className="text-slate-500 mt-1">Track and manage all active and past loan agreements.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleOpenModal}>
            <Plus className="h-4 w-4" />
            Create New Loan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-primary">
          <p className="text-sm font-medium text-slate-500">Total Disbursed</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
            ₹{(totalDisbursed / 100000).toFixed(2)}L
          </h3>
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="h-3 w-3" />
            Active across all accounts
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-indigo-500">
          <p className="text-sm font-medium text-slate-500">Active Principal</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
            ₹{(activePrincipal / 100000).toFixed(2)}L
          </h3>
          <p className="text-xs text-slate-400 mt-2">{loans.filter(l => l.status === 'active').length} Active Agreements</p>
        </Card>
        <Card className="p-6 border-l-4 border-l-amber-500">
          <p className="text-sm font-medium text-slate-500">Estimated Earnings</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
            ₹{(totalInterestEarned / 100000).toFixed(2)}L
          </h3>
          <p className="text-xs text-slate-400 mt-2">Projected Interest</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-slate-600 dark:text-slate-400">
                    {loan.id}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{loan.borrowerName}</p>
                    <p className="text-xs text-slate-500 capitalize">{loan.repaymentFrequency} repayment</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">₹{loan.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{loan.interestRate}% Interest</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[100px]">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">₹{loan.remainingBalance.toLocaleString()}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {Math.round((1 - loan.remainingBalance / loan.amount) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(1 - loan.remainingBalance / loan.amount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusVariant(loan.status)} className="flex items-center w-fit">
                      {getStatusIcon(loan.status)}
                      {loan.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(loan.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create New Loan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">Create New Loan</h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              
              {/* Select Borrower */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Borrower
                </label>
                {borrowers.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                    No borrowers found. Please add a borrower first.
                  </div>
                ) : (
                  <select
                    className={`flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 ${
                      errors.borrowerId ? 'border-red-500' : ''
                    }`}
                    value={borrowerId}
                    onChange={(e) => setBorrowerId(e.target.value)}
                  >
                    <option value="" disabled>-- Select a Borrower --</option>
                    {borrowers.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.phone})</option>
                    ))}
                  </select>
                )}
                {errors.borrowerId && (
                  <p className="text-xs text-red-500">{errors.borrowerId}</p>
                )}
              </div>

              {/* Amount */}
              <Input
                label="Loan Principal Amount (₹)"
                type="number"
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={errors.amount}
              />

              {/* Grid for Interest and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Interest Rate (% p.a.)"
                  type="number"
                  placeholder="12"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  error={errors.interestRate}
                />
                <Input
                  label="Duration (Months)"
                  type="number"
                  placeholder="12"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  error={errors.durationMonths}
                />
              </div>

              {/* Grid for Start Date and Repayment Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Agreement Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  error={errors.startDate}
                />
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Repayment Frequency
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    value={repaymentFrequency}
                    onChange={(e) => setRepaymentFrequency(e.target.value as 'weekly' | 'monthly')}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* EMI Preview Card */}
              {estimatedEmi > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Estimated EMI Repayment</p>
                    <p className="text-xs text-slate-400 capitalize">{repaymentFrequency} installments</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-primary">₹{estimatedEmi.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">/installment</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={borrowers.length === 0}>
                  Create Loan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
