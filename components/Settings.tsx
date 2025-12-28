import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Save, Check } from 'lucide-react';

const Settings: React.FC = () => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 1000);
  };

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
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-300 ${
            saveStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          {saveStatus === 'idle' && <><Save size={16} /> Save Changes</>}
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'success' && <><Check size={16} /> Saved!</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Menu */}
        <div className="space-y-1">
          {['General', 'Pipeline & Stages', 'Notifications', 'Integrations', 'Branding'].map((item, i) => (
            <button key={item} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-white text-navy-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}>
              {item}
            </button>
          ))}
        </div>

        {/* Right Col: Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-navy-900 mb-4">Pipeline Configuration</h3>
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Deal Rotting Period (Days)</label>
                  <input type="number" defaultValue={14} className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <p className="text-xs text-slate-400 mt-1">Leads inactive for this long will be flagged red.</p>
               </div>
               <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between py-2">
                     <div>
                        <p className="text-sm font-medium text-navy-900">Require specific fields for "Onboarded"</p>
                        <p className="text-xs text-slate-500">Force Social Security # and Trust Docs before moving stage.</p>
                     </div>
                     <ToggleRight size={32} className="text-teal-600 cursor-pointer" />
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-navy-900 mb-4">Notifications</h3>
            <div className="space-y-4 divide-y divide-slate-100">
               {['New Lead Assigned', 'Client Portfolio Drops > 5%', 'Workshop Registration', 'Daily Digest Email'].map(notif => (
                  <div key={notif} className="flex items-center justify-between py-2">
                     <p className="text-sm font-medium text-slate-700">{notif}</p>
                     <ToggleRight size={32} className="text-teal-600 cursor-pointer" />
                  </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;