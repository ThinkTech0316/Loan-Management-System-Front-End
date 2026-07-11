import React from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge.tsx';
import { Input } from '../components/atoms/Input';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin,
  Filter,
  Download,
  X,
  Users,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Borrower } from '../types';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';

const Borrowers: React.FC = () => {
  const [borrowers, setBorrowers] = React.useState<Borrower[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDistrict, setSelectedDistrict] = React.useState<string>('All');
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = React.useState<'active' | 'recycle_bin'>('active');
  const { confirm, ConfirmDialog } = useConfirm();

  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; }
  }, []);
  const isReadOnly = user?.isReadOnly === true;
  
  // Form State
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [nic, setNic] = React.useState('');
  const [district, setDistrict] = React.useState('Yogapuram');
  const [address, setAddress] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isAddModalOpen = searchParams.get('add') === 'true';

  const fetchBorrowers = React.useCallback(() => {
    if (viewMode === 'active') {
      apiService.getBorrowers().then(setBorrowers);
    } else {
      apiService.getDeletedBorrowers().then(setBorrowers);
    }
  }, [viewMode]);

  React.useEffect(() => {
    fetchBorrowers();
  }, [fetchBorrowers]);

  const handleOpenModal = () => {
    setSearchParams({ add: 'true' });
  };

  const handleCloseModal = () => {
    searchParams.delete('add');
    setSearchParams(searchParams);
    setName('');
    setEmail('');
    setPhone('');
    setNic('');
    setDistrict('Yogapuram');
    setAddress('');
    setErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!nic.trim()) {
      newErrors.nic = 'NIC number is required';
    } else if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/i.test(nic)) {
      newErrors.nic = 'Please enter a valid NIC (9 digits + V/X or 12 digits)';
    }
    if (!district.trim()) newErrors.district = 'Area/Village is required';
    if (!address.trim()) newErrors.address = 'Address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.addBorrower({
        name,
        email,
        phone,
        nic,
        district,
        address,
      });
      toast.success(`Borrower "${name}" added successfully!`);
      handleCloseModal();
      fetchBorrowers();
    } catch (e) {
      toast.error('Failed to create borrower. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Are you sure you want to move this client to the Recycle Bin?")) {
      await apiService.deleteBorrower(id);
      toast.success("Client moved to Recycle Bin.");
      fetchBorrowers();
    }
  };

  const handleRestore = async (id: string) => {
    await apiService.restoreBorrower(id);
    toast.success("Client restored successfully.");
    fetchBorrowers();
  };

  const handlePermDelete = async (id: string) => {
    if (await confirm("WARNING: Are you sure you want to permanently erase this client? This cannot be undone!")) {
      await apiService.permanentlyDeleteBorrower(id);
      toast.success("Client permanently deleted.");
      fetchBorrowers();
    }
  };

  const filteredBorrowers = borrowers.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.phone.includes(searchTerm) ||
                          (b.nic && b.nic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDistrict = selectedDistrict === 'All' || b.district === selectedDistrict;
    
    return matchesSearch && matchesDistrict;
  });

  const uniqueDistricts = React.useMemo(() => {
    const predefined = ['Yogapuram', 'Anichchayankullam', 'Vadakaadu', 'Mallavi Town', 'Thunukkai', 'Alankulam', 'Therankandal'];
    const fromBorrowers = borrowers.map(b => b.district).filter(Boolean);
    return Array.from(new Set([...predefined, ...fromBorrowers])).sort();
  }, [borrowers]);

  const districtsFilterList = ['All', ...uniqueDistricts];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Borrowers
            </h1>
            <Badge variant={viewMode === 'active' ? 'info' : 'warning'}>
              {borrowers.length} {viewMode === 'active' ? 'Total' : 'Deleted'}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium text-sm">
            {viewMode === 'active' ? 'Manage your borrower directory and their profiles.' : 'View and restore deleted clients.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'active' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Active
            </button>
            <button
              onClick={() => setViewMode('recycle_bin')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'recycle_bin' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Trash2 className="h-4 w-4" />
              Recycle Bin
            </button>
          </div>
          {viewMode === 'active' && !isReadOnly && (
            <>
              <Button variant="outline" className="flex-1 sm:flex-none">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={handleOpenModal} className="flex-1 sm:flex-none">
                <Plus className="h-4 w-4" />
                Add Borrower
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="overflow-hidden animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-cyan-400" />
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
          <div className="relative w-full md:w-[400px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, email or ID..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 text-sm dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative group min-w-[140px]">
              <select 
                className="w-full h-10 px-3 pl-8 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 text-sm dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300 appearance-none"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                {districtsFilterList.map(d => <option key={d} value={d}>{d === 'All' ? 'All Areas' : d}</option>)}
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

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Borrower</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                {!isReadOnly && <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredBorrowers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    {viewMode === 'active' ? 'No borrowers found.' : 'Recycle bin is empty.'}
                  </td>
                </tr>
              ) : (
                filteredBorrowers.map((borrower, index) => (
                  <tr 
                    key={borrower.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {borrower.avatar ? (
                          <img src={borrower.avatar} alt={borrower.name} className="h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform duration-300 shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 dark:from-blue-500/30 dark:to-cyan-400/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-xs border border-blue-200/50 dark:border-blue-800/50 group-hover:scale-105 transition-transform duration-300 shrink-0">
                            {borrower.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{borrower.name}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">NIC: {borrower.nic || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer truncate max-w-[180px]">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{borrower.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {borrower.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">{borrower.district}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={borrower.status === 'active' ? 'success' : 'neutral'} className="shadow-sm">
                        {borrower.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(borrower.createdAt).toLocaleDateString()}
                    </td>
                    {!isReadOnly && (
                      <td className="px-4 py-4 text-right">
                        {viewMode === 'active' ? (
                          <div className="flex justify-end gap-2">
                            <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(borrower.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Move to Recycle Bin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleRestore(borrower.id)}
                              className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors flex items-center gap-1"
                              title="Restore Client"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handlePermDelete(borrower.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                              title="Delete Permanently"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredBorrowers.length === 0 && (
          <div className="p-16 text-center relative z-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4 shadow-inner">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">No borrowers found</h3>
            <p className="text-slate-500 font-medium mt-1">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
          <p className="text-sm font-medium text-slate-500 text-center sm:text-left">
            Showing <span className="font-bold text-slate-900 dark:text-white">{filteredBorrowers.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{borrowers.length}</span> borrowers
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled>Next</Button>
          </div>
        </div>
      </Card>

      {/* Add Borrower Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-md max-h-[90vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-cyan-400" />
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 relative z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Users className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Add New Borrower</h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Form - scrollable */}
            <form onSubmit={handleSave} className="p-6 space-y-5 relative z-10 overflow-y-auto flex-1">
              <Input
                label="Full Name"
                placeholder="e.g. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. rajesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. +94 77 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="NIC Number"
                  placeholder="e.g. 199012345678"
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  error={errors.nic}
                />
                <div className="space-y-2">
                  <Input
                    label="Area/Village"
                    placeholder="Type or select area..."
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    error={errors.district}
                    list="district-options"
                  />
                  <datalist id="district-options">
                    {uniqueDistricts.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                  Residency Address
                </label>
                <div className="relative group">
                  <textarea
                    className={`flex min-h-[80px] w-full rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-700/80 dark:bg-slate-900/80 dark:placeholder:text-slate-500 dark:focus-visible:bg-slate-900 transition-all duration-300 shadow-sm hover:shadow-md resize-none ${
                      errors.address ? 'border-red-400 focus-visible:ring-red-500/20 focus-visible:border-red-500' : ''
                    }`}
                    placeholder="e.g. 12, Main St, Colombo, Western Province"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Borrower
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Borrowers;
