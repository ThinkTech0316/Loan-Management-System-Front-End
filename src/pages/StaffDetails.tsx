import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { Badge } from '../components/atoms/Badge';
import { Button } from '../components/atoms/Button';
import { Users as UsersIcon, Briefcase, CreditCard, MessageSquare, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedUser, setSelectedUser] = useState<any>(location.state?.user || null);
  const [selectedUserStats, setSelectedUserStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [detailViewType, setDetailViewType] = useState<'borrowers' | 'loans' | 'fds' | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchUserAndStats = async () => {
      if (!selectedUser && id) {
        // Fetch all users to find the specific one if accessed directly
        try {
          const users = await apiService.getUsers();
          const user = users.find((u: any) => u.id === id);
          if (user) {
            setSelectedUser(user);
          } else {
            toast.error('User not found');
            navigate('/staff');
            return;
          }
        } catch(e) {
          toast.error('Failed to load user');
          navigate('/staff');
          return;
        }
      }

      if (id) {
        setIsLoadingStats(true);
        try {
          const stats = await apiService.getUserStats(id);
          setSelectedUserStats(stats);
        } catch (e) {
          toast.error('Failed to load stats');
        } finally {
          setIsLoadingStats(false);
        }
      }
    };
    fetchUserAndStats();
  }, [id, selectedUser, navigate]);

  const handleViewDetails = async (type: 'borrowers' | 'loans' | 'fds') => {
    if (!selectedUser) return;
    setDetailViewType(type);
    setIsLoadingDetails(true);
    try {
      if (type === 'borrowers') {
        setDetailData(await apiService.getUserBorrowers(selectedUser.id));
      } else if (type === 'loans') {
        setDetailData(await apiService.getUserLoans(selectedUser.id));
      } else if (type === 'fds') {
        setDetailData(await apiService.getUserFixedDeposits(selectedUser.id));
      }
    } catch (e) {
      toast.error('Failed to load details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" onClick={() => navigate('/staff')} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
          <UsersIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white m-0 font-display">
            {selectedUser.name}'s Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage and view organization statistics</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Details</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">Email</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{selectedUser.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">Phone</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{selectedUser.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">Role</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">{selectedUser.role}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold mb-1">Status</p>
            <Badge variant={selectedUser.isActive ? 'success' : 'neutral'}>{selectedUser.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Statistics</h2>
        {detailViewType ? (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
                {detailViewType === 'fds' ? 'Fixed Deposits' : detailViewType}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setDetailViewType(null)}>Back to Stats</Button>
            </div>
            {isLoadingDetails ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-purple-500 animate-spin" />
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Name / ID</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Details</th>
                      <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {detailData.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No data found.</td></tr>
                    ) : detailData.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {detailViewType === 'borrowers' ? item.name : (item.borrowerName || `#${item.id}`)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {detailViewType === 'borrowers' ? item.phone : `Amount: Rs. ${item.amount || item.principalAmount || 0}`}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral">{item.status || 'Unknown'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : isLoadingStats ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-purple-500 animate-spin" />
          </div>
        ) : selectedUserStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800/30 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group" onClick={() => handleViewDetails('borrowers')}>
              <UsersIcon className="h-8 w-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Total Borrowers</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{selectedUserStats.borrowers}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 flex flex-col items-center justify-center border border-amber-100 dark:border-amber-800/30 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors group" onClick={() => handleViewDetails('loans')}>
              <Briefcase className="h-8 w-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold mb-1">Active Loans</p>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{selectedUserStats.activeLoans}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 flex flex-col items-center justify-center border border-emerald-100 dark:border-emerald-800/30 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group" onClick={() => handleViewDetails('fds')}>
              <CreditCard className="h-8 w-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Active FDs</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{selectedUserStats.activeFDs}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6 flex flex-col items-center justify-center border border-purple-100 dark:border-purple-800/30">
              <MessageSquare className="h-8 w-8 text-purple-500 mb-3" />
              <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-1">SMS Sent</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{selectedUserStats.smsCount}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">Failed to load statistics.</p>
        )}
      </div>
    </div>
  );
}
