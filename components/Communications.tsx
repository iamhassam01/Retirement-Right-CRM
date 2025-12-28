import React, { useState } from 'react';
import { Mail, MessageSquare, Plus, Clock, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import Modal from './Modal';

const Communications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const TEMPLATES = [
    { id: 1, name: 'Appointment Confirmation', type: 'Email', uses: 124, lastUsed: '2 hrs ago' },
    { id: 2, name: 'Q3 Performance Review', type: 'Email', uses: 45, lastUsed: 'Yesterday' },
    { id: 3, name: 'Workshop Reminder (24h)', type: 'SMS', uses: 89, lastUsed: 'Oct 25' },
    { id: 4, name: 'New Client Welcome', type: 'Email', uses: 12, lastUsed: 'Oct 20' },
  ];

  const LOGS = [
    { id: 1, to: 'Robert Sterling', template: 'Q3 Performance Review', time: '10:42 AM', status: 'Opened' },
    { id: 2, to: 'David Chen', template: 'Appointment Confirmation', time: '09:15 AM', status: 'Delivered' },
    { id: 3, to: 'Eleanor Vance', template: 'Workshop Reminder (24h)', time: 'Yesterday', status: 'Replied' },
  ];

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Communications</h2>
          <p className="text-slate-500 text-sm">Manage automated workflows and message templates.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-navy-800"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('templates')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'}`}
            >
              Templates
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'}`}
            >
              Automation Log
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map(template => (
                <div key={template.id} className="border border-slate-200 rounded-xl p-5 hover:border-teal-200 transition-colors group cursor-pointer bg-slate-50/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${template.type === 'Email' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {template.type === 'Email' ? <Mail size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <button className="text-slate-400 hover:text-teal-600">
                      <FileText size={18} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-1">{template.name}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
                    <span>Used {template.uses} times</span>
                    <span>{template.lastUsed}</span>
                  </div>
                </div>
              ))}
              
              {/* Add New Card */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors"
              >
                <Plus size={32} className="mb-2" />
                <span className="text-sm font-medium">Create Template</span>
              </button>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {LOGS.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-900">Sent to <span className="font-bold">{log.to}</span></p>
                      <p className="text-xs text-slate-500">{log.template}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {log.time}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      log.status === 'Opened' ? 'bg-blue-50 text-blue-700' :
                      log.status === 'Delivered' ? 'bg-slate-200 text-slate-600' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Template">
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Template Name</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Birthday Greeting" />
           </div>
           <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Channel</label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                 <button className="flex-1 text-sm py-1.5 rounded bg-white text-navy-900 shadow-sm font-medium">Email</button>
                 <button className="flex-1 text-sm py-1.5 rounded text-slate-500 hover:text-navy-900">SMS</button>
              </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Subject Line</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Hello {{client_name}}..." />
           </div>
           <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Body Content</label>
              <textarea className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" placeholder="Write your template here..."></textarea>
              <p className="text-xs text-slate-400 mt-1">Use {'{{variable}}'} to insert dynamic data.</p>
           </div>
           <div className="pt-4 flex gap-3">
             <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
             <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Save Template</button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Communications;