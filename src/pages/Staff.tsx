import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge.tsx';
import { Input } from '../components/atoms/Input';
import {
  Users,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
  Lock,
  Unlock,
  BarChart,
  MessageSquare,
  Users as UsersIcon,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin';
  isActive: boolean;
  createdAt: string;
}

const Staff: React.FC = () => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Stats Modal
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedUserStats, setSelectedUserStats] = useState<any>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const { confirm, ConfirmDialog } = useConfirm();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'superadmin' | 'admin'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = React.useCallback(async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (e) {
      toast.error('Failed to load users');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('admin');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createUser({ name, email, password, phone, role });
      toast.success('User created successfully');
      handleCloseModal();
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendToggle = async (user: StaffUser, e: React.MouseEvent) => {
    e.stopPropagation();
    const action = user.isActive ? 'suspend' : 'reactivate';
    if (await confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const res = await apiService.deleteUser(user.id);
        toast.success(res.message || `User ${action}d successfully`);
        fetchUsers();
      } catch (e: any) {
        toast.error(e.message || `Failed to ${action} user`);
      }
    }
  };

  const handleViewStats = async (user: StaffUser) => {
    setSelectedUserName(user.name);
    setIsStatsModalOpen(true);
    setIsLoadingStats(true);
    try {
      const stats = await apiService.getUserStats(user.id);
      setSelectedUserStats(stats);
    } catch (e) {
      toast.error('Failed to load user stats');
      setIsStatsModalOpen(false);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
            Staff Management
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Manage administrative access to your system.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      <Card className="overflow-hidden animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-cyan-400" />

        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative z-10">
          <div className="relative w-full md:w-[400px] group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 text-sm dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 shadow-sm transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-700/60">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Added On</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 font-medium">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => handleViewStats(user)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        {user.role === 'superadmin' ? (
                          <ShieldAlert className="h-4 w-4 text-amber-500" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-300">
                          {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant={user.isActive ? 'success' : 'neutral'}>
                        {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {user.role !== 'superadmin' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={user.isActive ? "Suspend User" : "Reactivate User"}
                            className={user.isActive 
                              ? "text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              : "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                            }
                            onClick={(e) => handleSuspendToggle(user, e)}
                          >
                            {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-cyan-400" />

            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Users className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">Add Staff Member</h2>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <Input
                label="Full Name"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Phone Number"
                placeholder="e.g. 0773630237"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Temporary Password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Role is strictly enforced as Admin */}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Stats Modal */}
      {isStatsModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-scale-in" onClick={() => setIsStatsModalOpen(false)}>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-indigo-400" />

            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <BarChart className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white m-0 font-display">{selectedUserName}'s Stats</h2>
              </div>
              <button onClick={() => setIsStatsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingStats ? (
                <div className="flex justify-center items-center py-12">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-purple-500 animate-spin" />
                </div>
              ) : selectedUserStats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800/30">
                    <UsersIcon className="h-6 w-6 text-blue-500 mb-2" />
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Total Borrowers</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{selectedUserStats.borrowers}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex flex-col items-center justify-center border border-amber-100 dark:border-amber-800/30">
                    <Briefcase className="h-6 w-6 text-amber-500 mb-2" />
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">Active Loans</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{selectedUserStats.activeLoans}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex flex-col items-center justify-center border border-emerald-100 dark:border-emerald-800/30">
                    <CreditCard className="h-6 w-6 text-emerald-500 mb-2" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Active FDs</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{selectedUserStats.activeFDs}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 flex flex-col items-center justify-center border border-purple-100 dark:border-purple-800/30">
                    <MessageSquare className="h-6 w-6 text-purple-500 mb-2" />
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">SMS Sent</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{selectedUserStats.smsCount}</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Failed to load statistics.</p>
              )}
            </div>
            
            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" onClick={() => setIsStatsModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog />
    </div>
  );
};

export default Staff;
