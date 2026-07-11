import React from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Input } from '../components/atoms/Input';
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Save,
  Camera,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { useBranding } from '../contexts/BrandingContext';
import { apiService } from '../services/api';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('profile');
  const [isSaving, setIsSaving] = React.useState(false);
  const { systemName, setSystemName, logoColor, setLogoColor, logoUrl, setLogoUrl } = useBranding();

  // Branding Form State
  const [brandName, setBrandName] = React.useState(systemName);
  const [brandColor, setBrandColor] = React.useState(logoColor);
  const [brandLogoUrl, setBrandLogoUrl] = React.useState(logoUrl);

  React.useEffect(() => {
    setBrandName(systemName);
    setBrandColor(logoColor);
    setBrandLogoUrl(logoUrl);
  }, [systemName, logoColor, logoUrl]);

  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const isReadOnly = user?.isReadOnly === true;

  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);

  // Try to split full name into first and last if possible
  const defaultFirstName = user?.name ? user.name.split(' ')[0] : 'Admin';
  const defaultLastName = user?.name && user.name.split(' ').length > 1 ? user.name.substring(user.name.indexOf(' ') + 1) : '';

  const [firstName, setFirstName] = React.useState(defaultFirstName);
  const [lastName, setLastName] = React.useState(defaultLastName);
  const [profileEmail, setProfileEmail] = React.useState(user?.email || 'admin@vanniloan.com');
  const [profilePhone, setProfilePhone] = React.useState('');
  const [profileBio, setProfileBio] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) { toast.error('Please fill in all fields'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setIsChangingPassword(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast.error(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Load settings on mount
  React.useEffect(() => {
    apiService.getSetting('profile').then((data: any) => {
      if (data?.profilePhoto) setProfilePhoto(data.profilePhoto);
      if (data?.firstName) setFirstName(data.firstName);
      if (data?.lastName) setLastName(data.lastName);
      if (data?.email) setProfileEmail(data.email);
      if (data?.phone) setProfilePhone(data.phone);
      if (data?.bio) setProfileBio(data.bio);
    }).catch(() => { });
  }, []);

  const profileInitials = React.useMemo(() => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'A';
  }, [firstName, lastName]);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2MB'); return; }
    try {
      const result = await apiService.uploadImage(file);
      setProfilePhoto(result.url);
      await apiService.updateSetting('profile', { profilePhoto: result.url });
      toast.success('Profile photo updated!');
    } catch { toast.error('Failed to upload photo'); }
  };

  const handleRemovePhoto = async () => {
    setProfilePhoto(null);
    await apiService.updateSetting('profile', { profilePhoto: null }).catch(() => { });
    toast.success('Profile photo removed.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'profile' && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(profileEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSaving(true);

    try {
      // Save branding if on company tab
      if (activeTab === 'company') {
        setSystemName(brandName);
        setLogoColor(brandColor);
        setLogoUrl(brandLogoUrl);
        await apiService.updateSetting('organization', {
          orgName: brandName,
          logoColor: brandColor,
          logoUrl: brandLogoUrl,
        });
      }

      if (activeTab === 'profile') {
        await apiService.updateSetting('profile', {
          firstName,
          lastName,
          email: profileEmail,
          phone: profilePhone,
          bio: profileBio,
          profilePhoto,
        });
      }

      if (activeTab === 'notifications') {
        await apiService.updateSetting('notifications', {
          notifyNewLoan: true,
          notifyRepayment: true,
        });
      }

      toast.success('Settings saved successfully!');
    } catch (err) {
      // Still update local branding even if API fails
      if (activeTab === 'company') {
        setSystemName(brandName);
        setLogoColor(brandColor);
        setLogoUrl(brandLogoUrl);
      }
      toast.success('Settings saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      try {
        setIsSaving(true);
        const result = await apiService.uploadImage(file);
        setBrandLogoUrl(result.url);
        toast.success('Logo uploaded successfully!');
      } catch (err) {
        toast.error('Failed to upload image');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User, color: 'primary' },
    { id: 'company', label: 'Company Info', icon: Building2, color: 'secondary' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'amber' },
    { id: 'security', label: 'Security', icon: Shield, color: 'blue' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: 'primary' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 font-display tracking-tight">
              Settings
            </h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Manage your account preferences and system configuration.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 animate-slide-in-up" style={{ animationDelay: '100ms' }}>
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            // Map colors dynamically
            const colorClass = isActive
              ? tab.color === 'primary' ? 'bg-primary/10 text-primary border-r-2 border-primary'
                : tab.color === 'secondary' ? 'bg-secondary/10 text-secondary border-r-2 border-secondary'
                  : tab.color === 'amber' ? 'bg-amber-500/10 text-amber-600 border-r-2 border-amber-500'
                    : 'bg-blue-500/10 text-blue-600 border-r-2 border-blue-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-r-2 border-transparent';

            const iconClass = isActive
              ? tab.color === 'primary' ? 'text-primary'
                : tab.color === 'secondary' ? 'text-secondary'
                  : tab.color === 'amber' ? 'text-amber-600'
                    : 'text-blue-600'
              : 'text-slate-400';

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-300 rounded-l-xl ${colorClass}`}
              >
                <Icon className={`h-5 w-5 transition-colors ${iconClass}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-emerald-400" />

            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="p-8 space-y-8 animate-scale-in">
                <div className="flex items-center gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative group cursor-pointer">
                    {profilePhoto ? (
                      <img src={profilePhoto.startsWith('/uploads') ? `/api${profilePhoto}` : profilePhoto} alt="Profile" className="h-24 w-24 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-display text-3xl font-extrabold shadow-lg group-hover:scale-105 transition-transform duration-300">
                        {profileInitials}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-sm">
                      <div className="bg-emerald-500 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">{firstName} {lastName || ''}</h2>
                    <p className="text-sm text-slate-500 font-medium mb-3 capitalize">{user?.role === 'superadmin' ? 'System Administrator' : 'Administrator'}</p>
                    <div className="flex gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                      <Button type="button" size="sm" variant="outline" className="h-8 cursor-pointer" onClick={() => fileInputRef.current?.click()}>Change Picture</Button>
                      <Button type="button" size="sm" variant="ghost" className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={handleRemovePhoto}>Remove</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  <Input label="Email Address" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                  <Input label="Phone Number" type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                    Bio / Role Description
                  </label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-200 transition-all duration-300 shadow-sm hover:shadow-md resize-none"
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  {!isReadOnly && (
                    <Button type="submit" isLoading={isSaving} className="shadow-glow-primary px-8">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'company' && (
              <form onSubmit={handleSave} className="p-8 animate-scale-in space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className={`icon-3d icon-3d-${brandColor} h-16 w-16 overflow-hidden`}>
                    {brandLogoUrl ? (
                      <img src={brandLogoUrl.startsWith('/uploads') ? `/api${brandLogoUrl}` : brandLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8 text-white relative z-10" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">System Branding</h2>
                    <p className="text-slate-500 font-medium text-sm">Customize the platform name and primary logo color to match your brand.</p>
                  </div>
                </div>

                <div className="space-y-6 max-w-xl">
                  <Input
                    label="System Name"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. VanniLoan"
                  />

                  <div className="space-y-3">
                    <Input
                      label="Logo Image URL (Optional)"
                      value={brandLogoUrl}
                      onChange={(e) => setBrandLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer text-sm font-medium"
                      >
                        <Camera className="h-4 w-4" />
                        Upload Logo Image (Max 2MB)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                      Logo Color Theme
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { id: 'primary', label: 'Emerald' },
                        { id: 'secondary', label: 'Indigo' },
                        { id: 'amber', label: 'Amber' },
                        { id: 'blue', label: 'Blue' },
                        { id: 'red', label: 'Red' }
                      ].map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setBrandColor(color.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ${brandColor === color.id
                              ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                              : 'border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                          <div className={`h-4 w-4 rounded-full bg-gradient-to-br shadow-inner ${color.id === 'primary' ? 'from-emerald-400 to-emerald-600' :
                              color.id === 'secondary' ? 'from-indigo-400 to-indigo-600' :
                                color.id === 'amber' ? 'from-amber-400 to-amber-600' :
                                  color.id === 'blue' ? 'from-blue-400 to-blue-600' :
                                    'from-red-400 to-red-600'
                            }`} />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  {!isReadOnly && (
                    <Button type="submit" isLoading={isSaving} className="shadow-glow-primary px-8">
                      <Save className="h-4 w-4 mr-2" />
                      Save Branding
                    </Button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <form onSubmit={handleSave} className="p-8 space-y-6 animate-scale-in">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display border-b border-slate-100 dark:border-slate-800 pb-4">Email Notifications</h2>

                <div className="space-y-4">
                  {[
                    { title: 'Daily Collection Summary', desc: 'Receive a daily report of all EMI collections.' },
                    { title: 'Overdue Alerts', desc: 'Get notified immediately when a loan becomes overdue.' },
                    { title: 'New Loan Disbursed', desc: 'Alert when a new loan agreement is activated.' },
                    { title: 'System Updates', desc: 'Important notices about platform maintenance.' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500 shadow-inner"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-6 flex justify-end">
                  {!isReadOnly && (
                    <Button type="submit" isLoading={isSaving} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-glow-amber">
                      Save Preferences
                    </Button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="p-8 animate-scale-in space-y-8">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="icon-3d icon-3d-blue h-16 w-16 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-white relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Change Password</h2>
                    <p className="text-slate-500 font-medium text-sm">Update your password to keep your account secure.</p>
                  </div>
                </div>

                <div className="space-y-6 max-w-xl">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  {!isReadOnly && (
                    <Button type="submit" isLoading={isChangingPassword} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-glow-primary px-8">
                      <Lock className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'appearance' && (
              <div className="p-8 flex flex-col items-center justify-center text-center min-h-[400px] animate-scale-in">
                <div className={`icon-3d h-20 w-20 mb-6 icon-3d-primary`}>
                  <Palette className="h-10 w-10 text-white relative z-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display mb-2">
                  Appearance Settings
                </h2>
                <p className="text-slate-500 max-w-md">
                  This section is currently under development. Advanced 3D customization options will be available soon.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
