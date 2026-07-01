import React from 'react';
import { createPortal } from 'react-dom';
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
  X,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
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
  const [method, setMethod] = React.useState<'cash' | 'bank_transfer' | 'mobile_wallet'>('bank_transfer');
  const [reference, setReference] = React.useState('');
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
    setMethod('bank_transfer');
    setReference('');
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
      newErrors.amount = `Amount cannot exceed outstanding balance of Rs. ${activeSelectedLoan.remainingBalance.toLocaleString()}`;
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
        reference: reference.trim() || undefined
      });
      toast.success('Payment successfully recorded in the system.');
      toast.success('📱 Notification receipt sent to the customer via SMS!', {
        duration: 5000,
        style: { border: '1px solid #10b981', backgroundColor: '#ecfdf5', color: '#047857' }
      });
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Repayments
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">History of all payments received from borrowers.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-primary" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Collected Today</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {collectedToday.toLocaleString()}
          </h3>
          <p className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            {repayments.filter(r => r.date === new Date().toISOString().split('T')[0]).length} Transactions
          </p>
        </Card>
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Pending collections</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {pendingCollection.toLocaleString()}
          </h3>
          <p className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            Outstanding Principal
          </p>
        </Card>
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 to-secondary" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Success Rate</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">99.1%</h3>
          <p className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            Last 30 days
          </p>
        </Card>
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-cyan-500" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Collection Efficiency</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">A+</h3>
          <p className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            Top Performance
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500" />
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
          <div className="relative w-full md:w-[400px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by receipt ID or loan ID..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Method & Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {repayments.map((payment, index) => (
                <tr 
                  key={payment.id} 
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-5 text-sm font-mono font-bold text-slate-600 dark:text-slate-400">
                    <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md w-fit inline-block">
                      {payment.id}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-8 px-3 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-500 w-fit">
                      {payment.loanId}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base font-extrabold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Rs. {payment.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
                      {payment.method.replace('_', ' ')}
                    </p>
                    {payment.reference && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: {payment.reference}</p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={payment.status === 'paid' ? 'success' : 'error'} className="shadow-sm">
                      {payment.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" title="View Details" className="hover:bg-primary/10 hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download Receipt" className="hover:bg-secondary/10 hover:text-secondary">
                        <FileText className="h-4 w-4" />
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
      {isRecordModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500" />
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Wallet className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Record EMI Payment</h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleRecord} className="p-6 space-y-5 relative z-10">
              
              {/* Select Loan */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Select Active Loan Agreement
                </label>
                {loans.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900 font-medium">
                    No active loans with outstanding balance found.
                  </div>
                ) : (
                  <div className="relative group">
                    <select
                      className={`flex h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 transition-all duration-300 shadow-sm hover:shadow-md appearance-none ${
                        errors.loanId ? 'border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-500' : ''
                      }`}
                      value={loanId}
                      onChange={(e) => setLoanId(e.target.value)}
                    >
                      <option value="" disabled>-- Select a Loan --</option>
                      {loans.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.id} - {l.borrowerName} (Bal: Rs. {l.remainingBalance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-sm" />
                  </div>
                )}
                {errors.loanId && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.loanId}
                  </p>
                )}
              </div>

              {/* Loan Details Quick View */}
              {activeSelectedLoan && (
                <div className="glass-card bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/50 rounded-xl p-4 space-y-2.5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                  <div className="flex justify-between text-xs relative z-10">
                    <span className="text-slate-500 font-medium">Borrower:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{activeSelectedLoan.borrowerName}</span>
                  </div>
                  <div className="flex justify-between text-xs relative z-10">
                    <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                    <span className="font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 rounded">Rs. {activeSelectedLoan.remainingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs relative z-10">
                    <span className="text-slate-500 font-medium">Total Loan Amount:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Rs. {activeSelectedLoan.amount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Repayment Amount */}
              <Input
                label="Repayment Amount (Rs.)"
                type="number"
                placeholder="e.g. 4500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={errors.amount}
              />

              {/* Grid for Date and Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Payment Received Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={errors.date}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`p-2 border rounded-xl text-xs font-medium transition-all ${
                        method === 'bank_transfer'
                          ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                      }`}
                      onClick={() => setMethod('bank_transfer')}
                    >
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      className={`p-2 border rounded-xl text-xs font-medium transition-all ${
                        method === 'cash'
                          ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                      }`}
                      onClick={() => setMethod('cash')}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      className={`p-2 border rounded-xl text-xs font-medium transition-all ${
                        method === 'mobile_wallet'
                          ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                      }`}
                      onClick={() => setMethod('mobile_wallet')}
                    >
                      Mobile Wallet
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Receipt / Reference Number (Optional)</span>
                  <span className="text-[10px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">For admin tracking</span>
                </label>
                <Input 
                  placeholder="e.g. TRN-987654321" 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">If the customer sent a bank transfer receipt, record the reference number here.</p>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 max-w-[220px]">
                  <span className="relative flex h-2 w-2 sm:h-3 sm:w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-emerald-500"></span>
                  </span>
                  Customer will receive an SMS notification once saved.
                </div>
                <div className="flex justify-end gap-3 shrink-0">
                  <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting} disabled={loans.length === 0} className="shadow-glow-amber bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600">
                    {isSubmitting ? 'Recording...' : 'Save & Notify'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Repayments;
