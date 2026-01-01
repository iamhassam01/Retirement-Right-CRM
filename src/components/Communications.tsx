import React, { useState, useEffect } from 'react';
import { templateService, Template, CommunicationLog } from '../services/template.service';
import { Mail, MessageSquare, Plus, Clock, CheckCircle2, FileText, Loader2, Trash2 } from 'lucide-react';
import Modal from './Modal';

const Communications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'Email' | 'SMS'>('Email');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [templatesData, logsData] = await Promise.all([
        templateService.getAll(),
        templateService.getLogs()
      ]);
      setTemplates(templatesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch communications data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formName || !formBody) return;

    setIsSaving(true);
    try {
      const newTemplate = await templateService.create({
        name: formName,
        type: formType,
        subject: formSubject || undefined,
        body: formBody
      });
      setTemplates(prev => [newTemplate, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templateService.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType('Email');
    setFormSubject('');
    setFormBody('');
  };

  const formatLastUsed = (date: string | null): string => {
    if (!date) return 'Never used';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-navy-900" size={32} />
      </div>
    );
  }

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
              Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'logs' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'}`}
            >
              Automation Log ({logs.length})
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <div key={template.id} className="border border-slate-200 rounded-xl p-5 hover:border-teal-200 transition-colors group bg-slate-50/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${template.type === 'Email' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {template.type === 'Email' ? <Mail size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-1">{template.name}</h3>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{template.body}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
                    <span>Used {template.usageCount} times</span>
                    <span>{formatLastUsed(template.lastUsedAt)}</span>
                  </div>
                </div>
              ))}

              {/* Add New Card */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors min-h-[180px]"
              >
                <Plus size={32} className="mb-2" />
                <span className="text-sm font-medium">Create Template</span>
              </button>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        Sent to <span className="font-bold">{log.recipient?.name || 'Unknown'}</span>
                      </p>
                      <p className="text-xs text-slate-500">{log.template?.name || log.channel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(log.sentAt).toLocaleString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'Opened' ? 'bg-blue-50 text-blue-700' :
                        log.status === 'Delivered' ? 'bg-slate-200 text-slate-600' :
                          log.status === 'Replied' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-rose-50 text-rose-700'
                      }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-slate-400">
                  <Mail size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-medium text-navy-900">No communication logs yet</p>
                  <p className="text-sm">Logs will appear when templates are used</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title="Create New Template">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Template Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Birthday Greeting"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Channel</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setFormType('Email')}
                className={`flex-1 text-sm py-1.5 rounded font-medium ${formType === 'Email' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
              >
                Email
              </button>
              <button
                onClick={() => setFormType('SMS')}
                className={`flex-1 text-sm py-1.5 rounded font-medium ${formType === 'SMS' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
              >
                SMS
              </button>
            </div>
          </div>
          {formType === 'Email' && (
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Subject Line</label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Hello {{client_name}}..."
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Body Content</label>
            <textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              placeholder="Write your template here..."
            />
            <p className="text-xs text-slate-400 mt-1">Use {'{{variable}}'} to insert dynamic data.</p>
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
            <button
              onClick={handleCreateTemplate}
              disabled={isSaving || !formName || !formBody}
              className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Save Template'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Communications;