import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import { Badge } from '../components/atoms/Badge.tsx';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  Bell, 
  CreditCard,
  ChevronRight,
  Upload,
  Download,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'organization' | 'security' | 'notifications' | 'billing';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('profile');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Profile Form State
  const [fullName, setFullName] = React.useState('Arun Kumar');
  const [email, setEmail] = React.useState('arun@vanniloan.com');
  const [phone, setPhone] = React.useState('+91 98765 43210');
  const [designation, setDesignation] = React.useState('Administrator');
  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);

  // Organization Form State
  const [orgName, setOrgName] = React.useState('VanniLoan Finance Ltd.');
  const [regNum, setRegNum] = React.useState('U65991TN2024PTC123456');
  const [taxId, setTaxId] = React.useState('33AAFCD1234F1Z5');
  const [orgAddress, setOrgAddress] = React.useState('12, West St, Chennai, Tamil Nadu');
  const [currency, setCurrency] = React.useState('INR (₹)');

  // Security Form State
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  // Notifications Form State
  const [notifyNewLoan, setNotifyNewLoan] = React.useState(true);
  const [notifyRepayment, setNotifyRepayment] = React.useState(true);
  const [smsAlerts, setSmsAlerts] = React.useState(false);
  const [weeklyDigest, setWeeklyDigest] = React.useState(true);

  // Handlers for Profile Photo
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds the 10MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        toast.success('Profile photo uploaded and updated in memory!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Profile photo removed successfully.');
  };

  // Save changes handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    toast.success('General Profile Information saved successfully!');
  };

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error('Organization Name is required.');
      return;
    }
    toast.success('Organization Information saved successfully!');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Confirm password does not match new password.');
      return;
    }
    toast.success('Your security password has been updated!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated successfully!');
  };

  const handleDeactivateAccount = () => {
    toast.warning('Account deactivation is blocked in demo mode.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white m-0">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your organization profile and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation / Tab Sidebar */}
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('profile')}
            className={`w-full justify-between ${
              activeTab === 'profile' 
                ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </div>
            {activeTab === 'profile' && <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('organization')}
            className={`w-full justify-between ${
              activeTab === 'organization' 
                ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4" />
              <span>Organization</span>
            </div>
            {activeTab === 'organization' && <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('security')}
            className={`w-full justify-between ${
              activeTab === 'security' 
                ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4" />
              <span>Security</span>
            </div>
            {activeTab === 'security' && <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('notifications')}
            className={`w-full justify-between ${
              activeTab === 'notifications' 
                ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
            {activeTab === 'notifications' && <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => setActiveTab('billing')}
            className={`w-full justify-between ${
              activeTab === 'billing' 
                ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </div>
            {activeTab === 'billing' && <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Button>
        </div>

        {/* Tab Form Contents */}
        <div className="md:col-span-3 space-y-6">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">General Information</h3>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                accept="image/*" 
                className="hidden" 
              />

              <div className="flex items-center gap-6 mb-8">
                {/* Clickable Profile Photo circle */}
                <div 
                  onClick={handleTriggerUpload}
                  className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-350 dark:border-slate-700 flex flex-col items-center justify-center text-slate-450 gap-1 overflow-hidden cursor-pointer hover:border-primary dark:hover:border-primary group relative transition-all"
                >
                  {profilePhoto ? (
                    <>
                      <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-4 w-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] group-hover:text-primary transition-colors mt-0.5 font-medium">Upload</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Profile Photo</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={handleTriggerUpload}>Change</Button>
                    {profilePhoto && (
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={handleRemovePhoto}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Full Name" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                  />
                  <Input 
                    label="Email Address" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                  <Input 
                    label="Phone Number" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                  <Input 
                    label="Designation" 
                    value={designation} 
                    onChange={(e) => setDesignation(e.target.value)} 
                  />
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {/* ORGANIZATION TAB */}
          {activeTab === 'organization' && (
            <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">Organization Profile</h3>
              
              <form onSubmit={handleSaveOrganization} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Organization Registered Name" 
                    value={orgName} 
                    onChange={(e) => setOrgName(e.target.value)} 
                  />
                  <Input 
                    label="Registration / CIN Number" 
                    value={regNum} 
                    onChange={(e) => setRegNum(e.target.value)} 
                  />
                  <Input 
                    label="GSTIN / Tax ID" 
                    value={taxId} 
                    onChange={(e) => setTaxId(e.target.value)} 
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Primary Currency
                    </label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="INR (₹)">Indian Rupee (INR - ₹)</option>
                      <option value="USD ($)">US Dollar (USD - $)</option>
                      <option value="EUR (€)">Euro (EUR - €)</option>
                      <option value="GBP (£)">British Pound (GBP - £)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Official HQ Address
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Security</h3>
                <p className="text-sm text-slate-500 mb-6">Update your password and secure your account.</p>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <Input 
                    label="Current Password" 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="New Password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input 
                      label="Confirm New Password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </Card>

              {/* DANGER ZONE CARD */}
              <Card className="p-6 border-red-200 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/10">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-red-600 m-0">Danger Zone</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-6">
                      Once you deactivate or delete your administration profile, all associated organization loan history will be frozen. Please proceed with extreme caution.
                    </p>
                    <Button variant="danger" size="sm" onClick={handleDeactivateAccount}>Deactivate Account</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <Card className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Notification Preferences</h3>
              <p className="text-sm text-slate-500 mb-6">Configure how and when you receive automated portfolio and transaction alerts.</p>
              
              <form onSubmit={handleSaveNotifications} className="space-y-6">
                <div className="space-y-4">
                  {/* Option 1 */}
                  <div className="flex items-start justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">New Loan Creation Alerts</label>
                      <p className="text-xs text-slate-500">Receive instant email receipts when any new agreement is successfully drafted.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifyNewLoan}
                      onChange={(e) => setNotifyNewLoan(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" 
                    />
                  </div>

                  {/* Option 2 */}
                  <div className="flex items-start justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">Repayment EMI Reminders</label>
                      <p className="text-xs text-slate-500">Email system reports for collected deposits or pending collection schedules.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notifyRepayment}
                      onChange={(e) => setNotifyRepayment(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" 
                    />
                  </div>

                  {/* Option 3 */}
                  <div className="flex items-start justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">SMS Collection Receipts</label>
                      <p className="text-xs text-slate-500">Send transactional text updates directly to borrowers upon recording deposits.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" 
                    />
                  </div>

                  {/* Option 4 */}
                  <div className="flex items-start justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <label className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Performance Digest</label>
                      <p className="text-xs text-slate-500">A structured spreadsheet layout detailing outstanding portfolio metrics and YTD earnings.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={weeklyDigest}
                      onChange={(e) => setWeeklyDigest(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary" 
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button type="submit">Save Preferences</Button>
                </div>
              </form>
            </Card>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* CURRENT SUBSCRIPTION CARD */}
              <Card className="p-6 border-l-4 border-l-primary bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Badge variant="success" className="mb-1">Active Plan</Badge>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white m-0">Professional SaaS Dashboard</h3>
                    <p className="text-sm text-slate-500">Billed monthly via registered Visa Card (**** 4242).</p>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">₹4,999</span>
                    <span className="text-xs text-slate-500 block mt-0.5">Renews on June 1, 2026</span>
                  </div>
                </div>
              </Card>

              {/* INVOICE HISTORY TABLE */}
              <Card className="overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">Past Invoice Statements</h3>
                  <Badge variant="neutral">YTD History</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/20 dark:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      <tr>
                        <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-400">INV-2026-005</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">May 1, 2026</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">₹4,999</td>
                        <td className="px-6 py-4"><Badge variant="success">PAID</Badge></td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => toast.success('Downloading Invoice INV-2026-005 PDF...')}>
                            <Download className="h-4 w-4 text-slate-400" />
                          </Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-400">INV-2026-004</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">Apr 1, 2026</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">₹4,999</td>
                        <td className="px-6 py-4"><Badge variant="success">PAID</Badge></td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => toast.success('Downloading Invoice INV-2026-004 PDF...')}>
                            <Download className="h-4 w-4 text-slate-400" />
                          </Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-400">INV-2026-003</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">Mar 1, 2026</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">₹4,999</td>
                        <td className="px-6 py-4"><Badge variant="success">PAID</Badge></td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => toast.success('Downloading Invoice INV-2026-003 PDF...')}>
                            <Download className="h-4 w-4 text-slate-400" />
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
