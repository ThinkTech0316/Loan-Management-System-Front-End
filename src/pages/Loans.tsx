import React from 'react';
import { createPortal } from 'react-dom';
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
  X,
  HandCoins,
  Search,
  Filter,
  MapPin
} from 'lucide-react';
import { apiService, type Installment } from '../services/mockApi';
import type { Loan, Borrower, Repayment } from '../types';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const Loans: React.FC = () => {
  const [loans, setLoans] = React.useState<Loan[]>([]);
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('All');
  const [searchParams, setSearchParams] = useSearchParams();

  // Details Modal State
  const [selectedLoanId, setSelectedLoanId] = React.useState<string | null>(null);
  const [scheduleInstallments, setScheduleInstallments] = React.useState<Installment[]>([]);
  const [loanRepayments, setLoanRepayments] = React.useState<Repayment[]>([]);
  const [detailsTab, setDetailsTab] = React.useState<'schedule' | 'history'>('schedule');

  // Quick Pay State
  const [quickPayInstallment, setQuickPayInstallment] = React.useState<Installment | null>(null);
  const [quickPayMethod, setQuickPayMethod] = React.useState<'cash' | 'bank_transfer' | 'mobile_wallet'>('bank_transfer');
  const [quickPayRef, setQuickPayRef] = React.useState('');
  const [isQuickPaying, setIsQuickPaying] = React.useState(false);

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

  // Load details when a loan is selected
  React.useEffect(() => {
    if (selectedLoanId) {
      apiService.getRepaymentSchedule(selectedLoanId).then(setScheduleInstallments);
      apiService.getRepayments().then(repayments => {
        setLoanRepayments(repayments.filter(r => r.loanId === selectedLoanId));
      });
    }
  }, [selectedLoanId]);

  const handleQuickPay = async () => {
    if (!quickPayInstallment || !selectedLoanId) return;
    setIsQuickPaying(true);
    try {
      await apiService.recordRepayment({
        loanId: selectedLoanId,
        amount: quickPayInstallment.amount,
        date: new Date().toISOString().split('T')[0],
        method: quickPayMethod,
        reference: quickPayRef.trim() || undefined
      });
      toast.success(`Installment #${quickPayInstallment.installmentNumber} marked as Paid!`);
      // Refresh details
      apiService.getRepaymentSchedule(selectedLoanId).then(setScheduleInstallments);
      apiService.getRepayments().then(repayments => {
        setLoanRepayments(repayments.filter(r => r.loanId === selectedLoanId));
      });
      fetchData(); // Refresh main table
      setQuickPayInstallment(null);
      setQuickPayRef('');
    } catch (e) {
      toast.error('Failed to record payment');
    } finally {
      setIsQuickPaying(false);
    }
  };

  const handleUndoPayment = async () => {
    if (!selectedLoanId) return;
    const latestRepayment = loanRepayments[0]; // newest is first
    if (!latestRepayment) {
      toast.error("No payment history found to undo.");
      return;
    }

    if (confirm("Are you sure you want to undo the most recent payment for this loan?")) {
      await apiService.deleteRepayment(latestRepayment.id);
      toast.success("Payment undone successfully.");
      apiService.getRepaymentSchedule(selectedLoanId).then(setScheduleInstallments);
      apiService.getRepayments().then(repayments => {
        setLoanRepayments(repayments.filter(r => r.loanId === selectedLoanId));
      });
      fetchData();
    }
  };

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
      case 'active': return <Clock className="h-3.5 w-3.5 mr-1.5" />;
      case 'completed': return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />;
      case 'overdue': return <AlertCircle className="h-3.5 w-3.5 mr-1.5" />;
      case 'pending': return <Clock className="h-3.5 w-3.5 mr-1.5" />;
      default: return null;
    }
  };

  // Calculated Portfolio Cards
  const totalDisbursed = loans.reduce((sum, l) => sum + l.amount, 0);
  const activePrincipal = loans.reduce((sum, l) => l.status !== 'completed' ? sum + l.remainingBalance : sum, 0);
  const totalInterestEarned = loans.reduce((sum, l) => sum + (l.amount * (l.interestRate / 100) * (l.durationMonths / 12)), 0);

  const districtsList = ['All', 'Yogapuram', 'Anichchayankullam', 'Vadakaadu', 'Mallavi Town', 'Thunukkai', 'Alankulam', 'Therankandal'];

  const filteredLoans = loans.filter(loan => {
    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    if (!borrower) return false;

    const matchesSearch = loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || borrower.district === selectedDistrict;

    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Loans
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Track and manage all active and past loan agreements.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
          <Button onClick={handleOpenModal} className="flex-1 md:flex-none">
            <Plus className="h-4 w-4" />
            Create New Loan
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search by loan ID or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 text-sm dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative group min-w-[140px]">
            <select
              className="w-full h-11 px-3 pl-8 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 text-sm dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300 appearance-none"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              {districtsList.map(d => <option key={d} value={d}>{d === 'All' ? 'All Areas' : d}</option>)}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/10">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-primary" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Total Disbursed</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {(totalDisbursed / 100000).toFixed(2)}L
          </h3>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2.5 py-1 rounded-md">
            <ArrowUpRight className="h-3 w-3" />
            Active across all accounts
          </div>
        </Card>
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg hover:shadow-secondary/10">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 to-secondary" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Active Principal</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {(activePrincipal / 100000).toFixed(2)}L
          </h3>
          <p className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            {loans.filter(l => l.status === 'active').length} Active Agreements
          </p>
        </Card>
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg hover:shadow-amber-500/10">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Estimated Earnings</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {(totalInterestEarned / 100000).toFixed(2)}L
          </h3>
          <p className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            Projected Interest
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-indigo-400" />
        <div className="overflow-x-auto relative z-10 pt-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 mb-3 opacity-20" />
                      <p>No loans found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan, index) => {
                  const borrower = borrowers.find(b => b.id === loan.borrowerId);
                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLoanId(loan.id)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-5 text-sm font-mono font-bold text-slate-600 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md w-fit inline-block transition-transform duration-300 group-hover:scale-105">
                          {loan.id}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-secondary transition-colors">{loan.borrowerName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{borrower?.district || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Rs. {loan.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{loan.interestRate}% Interest</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-full max-w-[120px]">
                          <div className="flex justify-between text-[11px] mb-1.5 font-bold">
                            <span className="text-amber-600 dark:text-amber-500">Rs. {loan.remainingBalance.toLocaleString()}</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {Math.round((1 - loan.remainingBalance / loan.amount) * 100)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full relative"
                              style={{ width: `${(1 - loan.remainingBalance / loan.amount) * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant={getStatusVariant(loan.status)} className="flex items-center w-fit shadow-sm">
                          {getStatusIcon(loan.status)}
                          {loan.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {new Date(loan.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create New Loan Modal */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-indigo-400" />

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <HandCoins className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Create New Loan</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-5 relative z-10 overflow-y-auto flex-1">

              {/* Select Borrower */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Select Borrower
                </label>
                {borrowers.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900 font-medium">
                    No borrowers found. Please add a borrower first.
                  </div>
                ) : (
                  <div className="relative group">
                    <select
                      className={`flex h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 transition-all duration-300 shadow-sm hover:shadow-md appearance-none ${errors.borrowerId ? 'border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-500' : ''
                        }`}
                      value={borrowerId}
                      onChange={(e) => setBorrowerId(e.target.value)}
                    >
                      <option value="" disabled>-- Select a Borrower --</option>
                      {borrowers.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.phone})</option>
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
                {errors.borrowerId && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.borrowerId}
                  </p>
                )}
              </div>

              {/* Amount */}
              <Input
                label="Loan Principal Amount (Rs.)"
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                    Repayment Frequency
                  </label>
                  <div className="relative group">
                    <div className="flex h-11 w-full items-center rounded-xl border border-slate-200/80 bg-slate-50 px-4 text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-400 font-medium">
                      Monthly
                    </div>
                  </div>
                </div>
              </div>

              {/* EMI Preview Card */}
              {estimatedEmi > 0 && (
                <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimated Repayment</p>
                    <p className="text-xs text-primary font-medium capitalize mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {repaymentFrequency} installments
                    </p>
                  </div>
                  <div className="text-right relative z-10">
                    <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">Rs. {estimatedEmi.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">/installment</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={borrowers.length === 0} className="shadow-glow-primary">
                  Create Loan
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Loan Details Modal */}
      {selectedLoanId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-secondary to-amber-400" />

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Loan Details: {selectedLoanId}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Full amortization schedule and repayment history</p>
              </div>
              <button
                onClick={() => setSelectedLoanId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">

              {/* Selected Loan Details Quick Card */}
              {(() => {
                const loan = loans.find(l => l.id === selectedLoanId);
                if (!loan) return null;
                const borrower = borrowers.find(b => b.id === loan.borrowerId);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 glass-card rounded-xl p-4 text-sm animate-slide-in-up">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Borrower</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{loan.borrowerName}</span>
                      {borrower && <span className="block text-xs text-slate-400">{borrower.phone}</span>}
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Loan Principal</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Rs. {loan.amount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Outstanding</span>
                      <span className="font-bold text-amber-600">Rs. {loan.remainingBalance.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Interest Rate</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{loan.interestRate}% p.a.</span>
                    </div>
                  </div>
                );
              })()}

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                <button
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${detailsTab === 'schedule' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  onClick={() => setDetailsTab('schedule')}
                >
                  Amortization Schedule
                </button>
                <button
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${detailsTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  onClick={() => setDetailsTab('history')}
                >
                  Payment History
                </button>
              </div>

              {/* Installments Table */}
              {detailsTab === 'schedule' && (
                <div className="border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 backdrop-blur-sm z-10">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">No.</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Principal</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Interest</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {scheduleInstallments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">
                            Loading schedule...
                          </td>
                        </tr>
                      ) : (
                        scheduleInstallments.map((inst, idx) => (
                          <tr key={inst.installmentNumber} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-slide-in-up" style={{ animationDelay: `${idx * 20}ms` }}>
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
                            <td className="px-4 py-3 text-right">
                              {inst.status === 'paid' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs px-3 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/30"
                                  onClick={handleUndoPayment}
                                >
                                  Undo
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="h-8 text-xs px-3 shadow-glow"
                                  onClick={() => setQuickPayInstallment(inst)}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* History Table */}
              {detailsTab === 'history' && (
                <div className="border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 backdrop-blur-sm z-10">
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Method</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {loanRepayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400">
                            No payment history found.
                          </td>
                        </tr>
                      ) : (
                        loanRepayments.map((rep, idx) => (
                          <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-slide-in-up" style={{ animationDelay: `${idx * 20}ms` }}>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                              {new Date(rep.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                              + Rs. {rep.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">{rep.method.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{rep.id || '-'}</td>
                            <td className="px-4 py-3">
                              <Badge variant={rep.status === 'paid' ? 'success' : 'warning'}>
                                {rep.status.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Quick Pay Modal */}
      {quickPayInstallment && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-scale-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-primary" />
                Mark Installment #{quickPayInstallment.installmentNumber} Paid
              </h3>
              <button
                onClick={() => setQuickPayInstallment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center">
                <p className="text-sm text-slate-500 mb-1">Payment Amount</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">Rs. {quickPayInstallment.amount.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className={`p-2 border rounded-xl text-xs font-medium transition-all ${quickPayMethod === 'bank_transfer'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    onClick={() => setQuickPayMethod('bank_transfer')}
                  >
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    className={`p-2 border rounded-xl text-xs font-medium transition-all ${quickPayMethod === 'cash'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    onClick={() => setQuickPayMethod('cash')}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    className={`p-2 border rounded-xl text-xs font-medium transition-all ${quickPayMethod === 'mobile_wallet'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    onClick={() => setQuickPayMethod('mobile_wallet')}
                  >
                    Mobile Wallet
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Reference No. (Optional)
                </label>
                <Input
                  placeholder="e.g. TRN-12345"
                  value={quickPayRef}
                  onChange={e => setQuickPayRef(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setQuickPayInstallment(null)}>Cancel</Button>
                <Button className="flex-1" onClick={handleQuickPay} isLoading={isQuickPaying}>Record Payment</Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Loans;
