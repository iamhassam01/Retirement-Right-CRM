import React, { useState, useEffect } from 'react';
import { settingsService, AppSettings } from '../services/settings.service';
import { ToggleLeft, ToggleRight, Save, Check, Loader2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

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
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getAll();
      if (Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await settingsService.updateBulk(settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('idle');
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

  const tabs = ['General', 'Pipeline & Stages', 'Notifications', 'Integrations', 'Branding'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-navy-900" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Settings</h2>
          <p className="text-slate-500 text-sm">Configure your workspace preferences and compliance rules.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-300 ${saveStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
        >
          {saveStatus === 'idle' && <><Save size={16} /> Save Changes</>}
          {saveStatus === 'saving' && <><Loader2 className="animate-spin" size={16} /> Saving...</>}
          {saveStatus === 'success' && <><Check size={16} /> Saved!</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Menu */}
        <div className="space-y-1">
          {tabs.map((item, i) => (
            <button
              key={item}
              onClick={() => setActiveTab(item.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_'))}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')
                  ? 'bg-white text-navy-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:bg-slate-100'
                }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Right Col: Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">General Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settings.branding?.company_name || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      branding: { ...prev.branding!, company_name: e.target.value }
                    }))}
                    className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Settings */}
          {activeTab === 'pipeline_stages' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Pipeline Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Deal Rotting Period (Days)</label>
                  <input
                    type="number"
                    value={settings.deal_rotting_days || 14}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      deal_rotting_days: parseInt(e.target.value)
                    }))}
                    className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">Leads inactive for this long will be flagged red.</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Notifications</h3>
              <div className="space-y-4 divide-y divide-slate-100">
                {[
                  { key: 'new_lead', label: 'New Lead Assigned' },
                  { key: 'portfolio_drop', label: 'Client Portfolio Drops > 5%' },
                  { key: 'workshop_registration', label: 'Workshop Registration' },
                  { key: 'daily_digest', label: 'Daily Digest Email' }
                ].map(notif => (
                  <div key={notif.key} className="flex items-center justify-between py-3">
                    <p className="text-sm font-medium text-slate-700">{notif.label}</p>
                    <button onClick={() => toggleNotification(notif.key as any)}>
                      {settings.notifications?.[notif.key as keyof typeof settings.notifications]
                        ? <ToggleRight size={32} className="text-teal-600" />
                        : <ToggleLeft size={32} className="text-slate-300" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrations Settings */}
          {activeTab === 'integrations' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Integrations</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-navy-900">Vapi Voice AI</p>
                  <p className="text-xs text-slate-500 mt-1">Connected and active</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-medium text-navy-900">n8n Automation</p>
                  <p className="text-xs text-slate-500 mt-1">Configure webhooks in n8n dashboard</p>
                </div>
              </div>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === 'branding' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Branding</h3>
              <div className="space-y-4">
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
                      className="w-12 h-12 rounded cursor-pointer border border-slate-200"
                    />
                    <span className="text-sm text-slate-600">{settings.branding?.primary_color}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;