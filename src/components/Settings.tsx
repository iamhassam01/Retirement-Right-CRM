import React, { useState, useEffect } from 'react';
import { settingsService, AppSettings } from '../services/settings.service';
import { profileService, UserProfile, UpdateProfileData } from '../services/profile.service';
import {
  ToggleLeft, ToggleRight, Save, Check, Loader2,
  User, Building, BarChart3, Bell, Link2, Shield,
  Camera, Lock, Mail, Phone, Briefcase
} from 'lucide-react';

const Settings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({});

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    deal_rotting_days: 14,
    notifications: {
      new_lead: true,
      portfolio_drop: true,
      workshop_registration: true,
      daily_digest: false
    },
    branding: {
      company_name: 'Retirement Right',
      primary_color: '#0f172a'
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, profileData] = await Promise.all([
        settingsService.getAll(),
        profileService.getProfile()
      ]);

      if (Object.keys(settingsData).length > 0) {
        setSettings(prev => ({ ...prev, ...settingsData }));
      }

      setProfile(profileData);
      setProfileForm({
        name: profileData.name,
        phone: profileData.phone || '',
        title: profileData.title || ''
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaveStatus('saving');
    try {
      await Promise.all([
        settingsService.updateBulk(settings),
        profileService.updateProfile(profileForm)
      ]);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('idle');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      await profileService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    }
  };

  const toggleNotification = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications!,
        [key]: !prev.notifications![key]
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-navy-900" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Settings</h2>
          <p className="text-slate-500 text-sm">Manage your profile and workspace preferences</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-all duration-300 ${saveStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
        >
          {saveStatus === 'idle' && <><Save size={16} /> Save All Changes</>}
          {saveStatus === 'saving' && <><Loader2 className="animate-spin" size={16} /> Saving...</>}
          {saveStatus === 'success' && <><Check size={16} /> Saved!</>}
        </button>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* MY PROFILE Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-100 rounded-lg">
              <User className="text-teal-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-navy-900">My Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar */}
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-navy-800 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div>
                <p className="font-medium text-navy-900">{profile?.name}</p>
                <p className="text-sm text-slate-500">{profile?.role}</p>
                <label className="mt-2 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer">
                  <Camera size={12} /> Change photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64 = reader.result as string;
                        try {
                          await profileService.updateAvatar(base64);
                          setProfile(prev => prev ? { ...prev, avatar: base64 } : null);
                        } catch (error) {
                          console.error('Failed to upload avatar:', error);
                          alert('Failed to upload avatar');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <User size={12} className="inline mr-1" /> Full Name
              </label>
              <input
                type="text"
                value={profileForm.name || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <Mail size={12} className="inline mr-1" /> Email (cannot change)
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <Phone size={12} className="inline mr-1" /> Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (480) 555-1234"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-slate-400 mt-1">Used for call transfers from AI assistant</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                <Briefcase size={12} className="inline mr-1" /> Job Title
              </label>
              <input
                type="text"
                value={profileForm.title || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Senior Advisor"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </section>

        {/* SECURITY Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Shield className="text-amber-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Security</h3>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              <Lock size={14} /> Change Password
            </h4>

            {passwordError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Password changed successfully!</p>
            )}

            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Current password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="New password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Update Password
            </button>
          </form>
        </section>

        {/* COMPANY Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Company</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Company Name</label>
              <input
                type="text"
                value={settings.branding?.company_name || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  branding: { ...prev.branding!, company_name: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.branding?.primary_color || '#0f172a'}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    branding: { ...prev.branding!, primary_color: e.target.value }
                  }))}
                  className="w-12 h-10 rounded cursor-pointer border border-slate-200"
                />
                <span className="text-sm text-slate-600 font-mono">{settings.branding?.primary_color}</span>
              </div>
            </div>
          </div>
        </section>

        {/* PIPELINE Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Pipeline & Leads</h3>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Deal Rotting Period (Days)</label>
            <input
              type="number"
              value={settings.deal_rotting_days || 14}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                deal_rotting_days: parseInt(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-slate-400 mt-1">Leads inactive for this many days will be flagged as needing attention.</p>
          </div>
        </section>

        {/* NOTIFICATIONS Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Bell className="text-rose-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Notifications</h3>
          </div>

          <div className="space-y-1 divide-y divide-slate-100">
            {[
              { key: 'new_lead', label: 'New Lead Assigned', desc: 'Get notified when a new lead is assigned to you' },
              { key: 'portfolio_drop', label: 'Portfolio Alert', desc: 'Alert when client portfolio drops more than 5%' },
              { key: 'workshop_registration', label: 'Workshop Registration', desc: 'Notification when someone registers for a workshop' },
              { key: 'daily_digest', label: 'Daily Digest Email', desc: 'Receive a daily summary of your activities' }
            ].map(notif => (
              <div key={notif.key} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">{notif.label}</p>
                  <p className="text-xs text-slate-400">{notif.desc}</p>
                </div>
                <button onClick={() => toggleNotification(notif.key as any)}>
                  {settings.notifications?.[notif.key as keyof typeof settings.notifications]
                    ? <ToggleRight size={32} className="text-teal-600" />
                    : <ToggleLeft size={32} className="text-slate-300" />
                  }
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* INTEGRATIONS Section */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Link2 className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-navy-900">Integrations</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-900">Vapi Voice AI</p>
                  <p className="text-xs text-slate-500 mt-1">AI phone assistant integration</p>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Connected</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-900">n8n Automation</p>
                  <p className="text-xs text-slate-500 mt-1">Workflow automation platform</p>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Connected</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;