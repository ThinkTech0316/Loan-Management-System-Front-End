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
  ShieldCheck,
  Search,
  Filter,
  MapPin,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/mockApi';
import type { FixedDeposit, Borrower, FDEarning } from '../types';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';

const FixedDeposits: React.FC = () => {
  const [fixedDeposits, setFixedDeposits] = React.useState<FixedDeposit[]>([]);
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('All');
  const [searchParams, setSearchParams] = useSearchParams();
  const { confirm, ConfirmDialog } = useConfirm();

  // Details Modal State
  const [selectedFDId, setSelectedFDId] = React.useState<string | null>(null);
  const [fdEarningsSchedule, setFdEarningsSchedule] = React.useState<FDEarning[]>([]);

  // Form State
  const [borrowerId, setBorrowerId] = React.useState('');
  const [principalAmount, setPrincipalAmount] = React.useState('');
  const [interestRate, setInterestRate] = React.useState('8.5');
  const [durationMonths, setDurationMonths] = React.useState('12');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isCreateModalOpen = searchParams.get('create') === 'true';

  const fetchData = React.useCallback(async () => {
    try {
      const fetchedFDs = await apiService.getFixedDeposits();
      const fetchedBorrowers = await apiService.getBorrowers();
      setFixedDeposits(fetchedFDs);
      setBorrowers(fetchedBorrowers);
      if (fetchedBorrowers.length > 0 && !borrowerId) {
        setBorrowerId(fetchedBorrowers[0].id);
      }
    } catch (e) {
      toast.error('Failed to load fixed deposits or borrowers data.');
    }
  }, [borrowerId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load details when an FD is selected
  React.useEffect(() => {
    if (selectedFDId) {
      apiService.getFDEarningsSchedule(selectedFDId).then(setFdEarningsSchedule);
    }
  }, [selectedFDId]);

  const handleOpenModal = () => {
    setSearchParams({ create: 'true' });
  };

  const handleDeleteFD = async (idToDel?: string) => {
    const id = idToDel || selectedFDId;
    if (!id) return;
    if (await confirm("Are you sure you want to permanently delete this fixed deposit? This cannot be undone.")) {
      try {
        await apiService.deleteFixedDeposit(id);
        toast.success("Fixed Deposit deleted successfully");
        setSelectedFDId(null);
        fetchData();
      } catch (e) {
        toast.error("Failed to delete fixed deposit");
      }
    }
  };

  const handleCloseModal = () => {
    searchParams.delete('create');
    setSearchParams(searchParams);
    setPrincipalAmount('');
    setInterestRate('8.5');
    setDurationMonths('12');
    setStartDate(new Date().toISOString().split('T')[0]);
    setErrors({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!borrowerId) newErrors.borrowerId = 'Please select a customer';
    
    const amtNum = parseFloat(principalAmount);
    if (!principalAmount.trim()) {
      newErrors.principalAmount = 'Amount is required';
    } else if (isNaN(amtNum) || amtNum <= 0) {
      newErrors.principalAmount = 'Please enter a valid amount';
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
      // Calculate maturity date based on start date and duration
      const start = new Date(startDate);
      start.setMonth(start.getMonth() + durNum);
      const maturityDate = start.toISOString().split('T')[0];

      await apiService.createFixedDeposit({
        borrowerId,
        principalAmount: amtNum,
        interestRate: rateNum,
        durationMonths: durNum,
        startDate,
        maturityDate,
      });
      toast.success('New Fixed Deposit has been successfully created!');
      handleCloseModal();
      fetchData();
    } catch (e) {
      toast.error('Failed to create Fixed Deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real-time Maturity Estimator
  const estimatedMaturity = React.useMemo(() => {
    const amt = parseFloat(principalAmount) || 0;
    const rate = parseFloat(interestRate) || 0;
    const mos = parseInt(durationMonths) || 0;
    if (amt <= 0 || mos <= 0) return 0;
    return Math.round(amt + (amt * (rate / 100) * (mos / 12)));
  }, [principalAmount, interestRate, durationMonths]);

  const getStatusVariant = (status: FixedDeposit['status']): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'active': return 'info';
      case 'matured': return 'success';
      case 'withdrawn': return 'warning';
      default: return 'neutral';
    }
  };

  const getStatusIcon = (status: FixedDeposit['status']) => {
    switch (status) {
      case 'active': return <Clock className="h-3.5 w-3.5 mr-1.5" />;
      case 'matured': return <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />;
      case 'withdrawn': return <AlertCircle className="h-3.5 w-3.5 mr-1.5" />;
      default: return null;
    }
  };

  // Calculated Portfolio Cards
  const totalDeposits = fixedDeposits.reduce((sum, fd) => sum + fd.principalAmount, 0);
  const activeDeposits = fixedDeposits.filter(fd => fd.status === 'active').reduce((sum, fd) => sum + fd.principalAmount, 0);
  const totalProjectedInterest = fixedDeposits.reduce((sum, fd) => sum + (fd.maturityAmount - fd.principalAmount), 0);

  const districtsList = ['All', 'Yogapuram', 'Anichchayankullam', 'Vadakaadu', 'Mallavi Town', 'Thunukkai', 'Alankulam', 'Therankandal'];

  const filteredFDs = fixedDeposits.filter(fd => {
    const borrower = borrowers.find(b => b.id === fd.borrowerId);
    if (!borrower) return false;
    
    const matchesSearch = fd.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fd.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || borrower.district === selectedDistrict;
    
    return matchesSearch && matchesDistrict;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Fixed Deposits
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Track and manage customer fixed deposits and investments.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
          <Button onClick={handleOpenModal} className="flex-1 md:flex-none">
            <Plus className="h-4 w-4" />
            Create Fixed Deposit
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by FD ID or customer name..." 
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
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Total Deposits</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {(totalDeposits / 100000).toFixed(2)}L
          </h3>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2.5 py-1 rounded-md">
            <ArrowUpRight className="h-3 w-3" />
            All time deposits
          </div>
        </Card>
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg hover:shadow-secondary/10">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-400 to-secondary" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Active Portfolio</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {(activeDeposits / 100000).toFixed(2)}L
          </h3>
          <p className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            {fixedDeposits.filter(fd => fd.status === 'active').length} Active FDs
          </p>
        </Card>
        <Card className="p-6 relative overflow-hidden group animate-slide-in-up hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-lg hover:shadow-amber-500/10">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">Projected Interest Payouts</p>
          <h3 className="text-3xl font-extrabold mt-2 text-slate-900 dark:text-white font-display">
            Rs. {(totalProjectedInterest / 100000).toFixed(2)}L
          </h3>
          <p className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 w-fit px-2.5 py-1 rounded-md mt-3">
            Estimated returns for customers
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden animate-slide-in-up" style={{ animationDelay: '200ms' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-indigo-400" />
        <div className="overflow-x-auto relative z-10 pt-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">FD ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Principal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Maturity Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Maturity Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredFDs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 mb-3 opacity-20" />
                      <p>No fixed deposits found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFDs.map((fd, index) => {
                  const borrower = borrowers.find(b => b.id === fd.borrowerId);
                  return (
                    <tr 
                      key={fd.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedFDId(fd.id)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-5 text-sm font-mono font-bold text-slate-600 dark:text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md w-fit inline-block transition-transform duration-300 group-hover:scale-105">
                          {fd.id}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-secondary transition-colors">{fd.borrowerName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{borrower?.district || 'Unknown'}</span>
                        </div>
                      </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Rs. {fd.principalAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{fd.interestRate}% p.a. for {fd.durationMonths}m</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-extrabold text-amber-600 dark:text-amber-500">Rs. {fd.maturityAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">+ Rs. {(fd.maturityAmount - fd.principalAmount).toLocaleString()} interest</p>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={getStatusVariant(fd.status)} className="flex items-center w-fit shadow-sm">
                      {getStatusIcon(fd.status)}
                      {fd.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {new Date(fd.maturityDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFD(fd.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
          </tbody>
          </table>
        </div>
      </Card>

      {/* Create New FD Modal */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-indigo-400" />
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Create Fixed Deposit</h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-5 relative z-10">
              
              {/* Select Customer */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Select Customer
                </label>
                {borrowers.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900 font-medium">
                    No customers found. Please add a customer first.
                  </div>
                ) : (
                  <div className="relative group">
                    <select
                      className={`flex h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 transition-all duration-300 shadow-sm hover:shadow-md appearance-none ${
                        errors.borrowerId ? 'border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-500' : ''
                      }`}
                      value={borrowerId}
                      onChange={(e) => setBorrowerId(e.target.value)}
                    >
                      <option value="" disabled>-- Select a Customer --</option>
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
                label="Principal Amount (Rs.)"
                type="number"
                placeholder="e.g. 100000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                error={errors.principalAmount}
              />

              {/* Grid for Interest and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Interest Rate (% p.a.)"
                  type="number"
                  placeholder="8.5"
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

              {/* Start Date */}
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                error={errors.startDate}
              />

              {/* Maturity Preview Card */}
              {estimatedMaturity > 0 && (
                <div className="glass-card p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimated Maturity</p>
                  </div>
                  <div className="text-right relative z-10">
                    <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">Rs. {estimatedMaturity.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={borrowers.length === 0} className="shadow-glow-primary">
                  Create Deposit
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* FD Details Modal */}
      {selectedFDId && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-4xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-primary" />
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Fixed Deposit Details: {selectedFDId}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Month-by-month earnings projection</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/30"
                  onClick={() => handleDeleteFD()}
                >
                  Delete FD
                </Button>
                <button 
                  onClick={() => setSelectedFDId(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Selected FD Details Quick Card */}
              {(() => {
                const fd = fixedDeposits.find(f => f.id === selectedFDId);
                if (!fd) return null;
                const borrower = borrowers.find(b => b.id === fd.borrowerId);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 glass-card rounded-xl p-4 text-sm animate-slide-in-up">
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Borrower</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{fd.borrowerName}</span>
                      {borrower && <span className="block text-xs text-slate-400">{borrower.phone}</span>}
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Principal</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Rs. {fd.principalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Maturity Amount</span>
                      <span className="font-bold text-emerald-600">Rs. {fd.maturityAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block font-medium">Interest & Duration</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{fd.interestRate}% p.a. • {fd.durationMonths}m</span>
                    </div>
                  </div>
                );
              })()}

              <h3 className="font-bold text-slate-900 dark:text-white mt-6 mb-3 animate-slide-in-up" style={{ animationDelay: '100ms' }}>Earnings Projection</h3>

              {/* Earnings Table */}
              <div className="border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 backdrop-blur-sm z-10">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Accrued Interest</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {fdEarningsSchedule.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400">
                          Loading projection...
                        </td>
                      </tr>
                    ) : (
                      fdEarningsSchedule.map((earning, idx) => (
                        <tr key={earning.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-slide-in-up" style={{ animationDelay: `${idx * 20}ms` }}>
                          <td className="px-4 py-3 text-slate-500 font-medium">Month {earning.month}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                            {new Date(earning.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium">
                            + Rs. {earning.accruedInterest.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                            Rs. {earning.totalValue.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
      
      <ConfirmDialog />
    </div>
  );
};

export default FixedDeposits;
