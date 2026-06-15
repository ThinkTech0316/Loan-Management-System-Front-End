import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge.tsx';
import { Input } from '../components/atoms/Input';
import { 
  Search, 
  Download, 
  Plus,
  Eye,
  FileText,
  X
} from 'lucide-react';
import { apiService } from '../services/mockApi';
import type { Repayment, Loan } from '../types';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const Repayments: React.FC = () => {
  const [repayments, setRepayments] = React.useState<Repayment[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Form State
  const [loanId, setLoanId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = React.useState<'cash' | 'bank_transfer' | 'upi'>('upi');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isRecordModalOpen = searchParams.get('record') === 'true';

  const fetchData = React.useCallback(async () => {
    try {
      const fetchedRepayments = await apiService.getRepayments();
      const fetchedLoans = await apiService.getLoans();
      setRepayments(fetchedRepayments);
      
      const activeLoans = fetchedLoans.filter(l => l.status === 'active' || l.status === 'overdue');
      setLoans(activeLoans);
      if (activeLoans.length > 0 && !loanId) {
        setLoanId(activeLoans[0].id);
      }
    } catch (e) {
      toast.error('Failed to load repayments or active loans data.');
    }
  }, [loanId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pre-fill amount with loan's EMI or remaining balance
  const activeSelectedLoan = React.useMemo(() => {
    return loans.find(l => l.id === loanId);
  }, [loanId, loans]);

  React.useEffect(() => {
    if (activeSelectedLoan) {
      // Estimate EMI
      const amt = activeSelectedLoan.amount;
      const rate = (activeSelectedLoan.interestRate || 0) / 12 / 100;
      const mos = activeSelectedLoan.durationMonths;
      let emi = 0;
      if (rate === 0) {
        emi = amt / mos;
      } else {
        emi = (amt * rate * Math.pow(1 + rate, mos)) / (Math.pow(1 + rate, mos) - 1);
      }
      const roundedEmi = Math.round(emi);
      // Pre-fill amount (cap at remaining balance)
      const defaultAmount = Math.min(roundedEmi, activeSelectedLoan.remainingBalance);
      setAmount(String(defaultAmount));
    }
  }, [activeSelectedLoan]);

  const handleOpenModal = () => {
    setSearchParams({ record: 'true' });
  };

  const handleCloseModal = () => {
    searchParams.delete('record');
    setSearchParams(searchParams);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setMethod('upi');
    setErrors({});
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!loanId) newErrors.loanId = 'Please select a loan';
    
    const amtNum = parseFloat(amount);
    if (!amount.trim()) {
      newErrors.amount = 'Repayment amount is required';
    } else if (isNaN(amtNum) || amtNum <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (activeSelectedLoan && amtNum > activeSelectedLoan.remainingBalance) {
      newErrors.amount = `Amount cannot exceed outstanding balance of ₹${activeSelectedLoan.remainingBalance.toLocaleString()}`;
    }

    if (!date) newErrors.date = 'Repayment date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.recordRepayment({
        loanId,
        amount: amtNum,
        date,
        method,
      });
      toast.success('Repayment/EMI payment successfully recorded!');
      handleCloseModal();
      fetchData();
    } catch (e) {
      toast.error('Failed to record repayment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats calculations
  const collectedToday = repayments
    .filter(r => {
      const todayStr = new Date().toISOString().split('T')[0];
      return r.date === todayStr && r.status === 'paid';
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingCollection = loans.reduce((sum, l) => sum + l.remainingBalance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white m-0">Repayments</h1>
          <p className="text-slate-500 mt-1">History of all payments received from borrowers.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Download History
          </Button>
          <Button onClick={handleOpenModal}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm font-medium text-slate-500">Collected Today</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">₹{collectedToday.toLocaleString()}</h3>
          <p className="text-xs text-emerald-600 mt-2">
            {repayments.filter(r => r.date === new Date().toISOString().split('T')[0]).length} Transactions
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-slate-500">Pending collections</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">₹{pendingCollection.toLocaleString()}</h3>
          <p className="text-xs text-amber-500 mt-2">Outstanding Principal</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-slate-500">Success Rate</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">99.1%</h3>
          <p className="text-xs text-slate-400 mt-2">Last 30 days</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-slate-500">Collection Efficiency</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">A+</h3>
          <p className="text-xs text-primary mt-2">Top Performance</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by receipt ID or loan ID..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {repayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-medium text-slate-600 dark:text-slate-400">
                    {payment.id}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {payment.loanId}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-emerald-600">₹{payment.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral" className="capitalize">
                      {payment.method.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={payment.status === 'paid' ? 'success' : 'error'}>
                      {payment.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" title="View Details">
                        <Eye className="h-4 w-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download Receipt">
                        <FileText className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0">Record EMI Payment</h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleRecord} className="p-6 space-y-4">
              
              {/* Select Loan */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select Active Loan Agreement
                </label>
                {loans.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                    No active loans with outstanding balance found.
                  </div>
                ) : (
                  <select
                    className={`flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 ${
                      errors.loanId ? 'border-red-500' : ''
                    }`}
                    value={loanId}
                    onChange={(e) => setLoanId(e.target.value)}
                  >
                    <option value="" disabled>-- Select a Loan --</option>
                    {loans.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.id} - {l.borrowerName} (Bal: ₹{l.remainingBalance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
                {errors.loanId && (
                  <p className="text-xs text-red-500">{errors.loanId}</p>
                )}
              </div>

              {/* Loan Details Quick View */}
              {activeSelectedLoan && (
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Borrower:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{activeSelectedLoan.borrowerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Outstanding Balance:</span>
                    <span className="font-semibold text-amber-600">₹{activeSelectedLoan.remainingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Total Loan Amount:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">₹{activeSelectedLoan.amount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Repayment Amount */}
              <Input
                label="Repayment Amount (₹)"
                type="number"
                placeholder="e.g. 4500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={errors.amount}
              />

              {/* Grid for Date and Method */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Payment Received Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={errors.date}
                />
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'cash' | 'bank_transfer' | 'upi')}
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash Payment</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={loans.length === 0}>
                  Record EMI
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repayments;
