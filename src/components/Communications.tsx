import React, { useState, useEffect, useRef } from 'react';
import { automationService, Template, AutomationLog } from '../services/automation.service';
import { clientService } from '../services/client.service';
import { Mail, Plus, Clock, CheckCircle2, Loader2, Trash2, Send, Users, ChevronRight, AlertCircle, Edit2 } from 'lucide-react';
import Modal from './Modal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  advisorId?: string;
}

const AVAILABLE_VARIABLES = [
  { key: '{{client_name}}', label: 'Client Full Name' },
  { key: '{{first_name}}', label: 'First Name' },
  { key: '{{email}}', label: 'Email Address' },
  { key: '{{phone}}', label: 'Phone Number' },
  { key: '{{advisor_name}}', label: 'Advisor Name' },
  { key: '{{company}}', label: 'Company (Retirement Right)' },
  { key: '{{date}}', label: 'Current Date' },
];

const Communications: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'automation'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Template Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  // Quill editor config
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  // Automation Tab State
  const [step, setStep] = useState(1); // 1: Select Template, 2: Select Recipients, 3: Confirm & Send
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [templatesData, logsData, clientsData] = await Promise.all([
        automationService.getTemplates(),
        automationService.getLogs(),
        clientService.getAll()
      ]);
      setTemplates(templatesData);
      setLogs(logsData);
      setClients(clientsData.filter((c: Client) => c.email)); // Only clients with email
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Template CRUD
  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormSubject('');
    setFormBody('');
    setIsTemplateModalOpen(true);
  };

  const openEditModal = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject || '');
    setFormBody(template.body);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!formName || !formBody) return;
    setIsSaving(true);
    try {
      if (editingTemplate) {
        const updated = await automationService.updateTemplate(editingTemplate.id, {
          name: formName,
          subject: formSubject,
          body: formBody
        });
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const newTemplate = await automationService.createTemplate({
          name: formName,
          type: 'Email',
          subject: formSubject,
          body: formBody
        });
        setTemplates(prev => [newTemplate, ...prev]);
      }
      setIsTemplateModalOpen(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await automationService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const insertVariable = (variable: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const selection = quill.getSelection();
      const position = selection ? selection.index : quill.getLength();
      quill.insertText(position, variable);
      quill.setSelection(position + variable.length, 0);
    } else {
      setFormBody(prev => prev + variable);
    }
  };

  // Client Selection
  const toggleClient = (clientId: string) => {
    setSelectedClientIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const toggleAllClients = () => {
    if (selectedClientIds.size === clients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(clients.map(c => c.id)));
    }
  };

  // Send Emails
  const handleSendEmails = async () => {
    if (!selectedTemplate || selectedClientIds.size === 0) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const recipients = clients
        .filter(c => selectedClientIds.has(c.id))
        .map(c => ({
          clientId: c.id,
          email: c.email!,
          client_name: c.name,
          first_name: c.name.split(' ')[0],
          phone: c.phone || ''
        }));

      const result = await automationService.sendEmails(selectedTemplate.id, recipients);
      setSendResult({ sent: result.sent, failed: result.failed });

      // Refresh logs
      const logsData = await automationService.getLogs();
      setLogs(logsData);

      // Reset after success
      setTimeout(() => {
        setStep(1);
        setSelectedTemplate(null);
        setSelectedClientIds(new Set());
        setSendResult(null);
        setActiveTab('automation');
      }, 3000);
    } catch (error) {
      console.error('Send failed:', error);
      setSendResult({ sent: 0, failed: selectedClientIds.size });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-navy-900" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Communications</h2>
          <p className="text-slate-500 text-xs sm:text-sm">Create templates and send bulk emails via automation.</p>
        </div>
        {activeTab === 'templates' && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-teal-700 active:bg-teal-800 min-h-[44px]"
          >
            <Plus size={16} /> New Template
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
        {/* Tabs */}
        <div className="border-b border-slate-200 px-4 sm:px-6 overflow-x-auto">
          <div className="flex gap-4 sm:gap-8">
            <button
              onClick={() => { setActiveTab('templates'); setStep(1); }}
              className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[48px] ${activeTab === 'templates' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'}`}
            >
              Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('automation')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[48px] ${activeTab === 'automation' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'}`}
            >
              Automation ({logs.length})
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* ========== TEMPLATES TAB ========== */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {templates.map(template => (
                <div key={template.id} className="border border-slate-200 rounded-xl p-5 hover:border-teal-200 transition-colors group bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <Mail size={20} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(template)} className="text-slate-400 hover:text-teal-600">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteTemplate(template.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-1">{template.name}</h3>
                  {template.subject && <p className="text-xs text-slate-600 mb-2">{template.subject}</p>}
                  <p className="text-xs text-slate-400 line-clamp-2">{template.body}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                    <span>Used {template.usageCount || 0} times</span>
                    <span>{template.lastUsedAt ? formatDate(template.lastUsedAt) : 'Never used'}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={openCreateModal}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors min-h-[180px]"
              >
                <Plus size={32} className="mb-2" />
                <span className="text-sm font-medium">Create Template</span>
              </button>
            </div>
          )}

          {/* ========== AUTOMATION TAB ========== */}
          {activeTab === 'automation' && (
            <div>
              {/* Step Progress */}
              <div className="flex items-center gap-4 mb-8">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {step > s ? <CheckCircle2 size={16} /> : s}
                    </div>
                    <span className={`ml-2 text-sm ${step >= s ? 'text-navy-900 font-medium' : 'text-slate-400'}`}>
                      {s === 1 ? 'Select Template' : s === 2 ? 'Select Recipients' : 'Send'}
                    </span>
                    {s < 3 && <ChevronRight size={16} className="mx-4 text-slate-300" />}
                  </div>
                ))}
              </div>

              {/* Step 1: Select Template */}
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-navy-900 mb-4">Choose a Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => { setSelectedTemplate(template); setStep(2); }}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${selectedTemplate?.id === template.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-slate-200 hover:border-teal-300 bg-white'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mb-2">
                            <Mail size={18} />
                          </div>
                          {selectedTemplate?.id === template.id && (
                            <CheckCircle2 size={20} className="text-teal-600" />
                          )}
                        </div>
                        <h4 className="font-semibold text-navy-900">{template.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{template.subject}</p>
                      </button>
                    ))}
                  </div>
                  {templates.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Mail size={48} className="mx-auto mb-4" />
                      <p className="text-lg font-medium text-navy-900">No templates yet</p>
                      <p className="text-sm mb-4">Create a template first</p>
                      <button onClick={() => setActiveTab('templates')} className="text-teal-600 hover:underline text-sm">
                        Go to Templates
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Select Recipients */}
              {step === 2 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-navy-900">Select Recipients</h3>
                      <p className="text-sm text-slate-500">Template: <span className="font-medium text-navy-900">{selectedTemplate?.name}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-600">
                        <Users size={16} className="inline mr-1" />
                        {selectedClientIds.size} selected
                      </span>
                      <button
                        onClick={() => setStep(3)}
                        disabled={selectedClientIds.size === 0}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-teal-700"
                      >
                        Continue
                      </button>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedClientIds.size === clients.length && clients.length > 0}
                              onChange={toggleAllClients}
                              className="rounded border-slate-300"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {clients.map(client => (
                          <tr key={client.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedClientIds.has(client.id)}
                                onChange={() => toggleClient(client.id)}
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-navy-900">{client.name}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{client.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                client.status === 'Lead' ? 'bg-blue-50 text-blue-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                {client.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button onClick={() => setStep(1)} className="mt-4 text-sm text-slate-500 hover:text-navy-900">
                    ← Back to templates
                  </button>
                </div>
              )}

              {/* Step 3: Confirm & Send */}
              {step === 3 && (
                <div className="max-w-xl mx-auto text-center">
                  {sendResult ? (
                    <div className={`p-8 rounded-xl ${sendResult.sent > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      {sendResult.sent > 0 ? (
                        <CheckCircle2 size={48} className="mx-auto text-emerald-600 mb-4" />
                      ) : (
                        <AlertCircle size={48} className="mx-auto text-rose-600 mb-4" />
                      )}
                      <h3 className="text-xl font-bold text-navy-900 mb-2">
                        {sendResult.sent > 0 ? 'Emails Sent!' : 'Send Failed'}
                      </h3>
                      <p className="text-slate-600">
                        {sendResult.sent} sent, {sendResult.failed} failed
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-teal-100 text-teal-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Send size={28} />
                      </div>
                      <h3 className="text-xl font-bold text-navy-900 mb-2">Ready to Send</h3>
                      <p className="text-slate-600 mb-6">
                        Sending <span className="font-bold">{selectedTemplate?.name}</span> to{' '}
                        <span className="font-bold">{selectedClientIds.size}</span> recipients
                      </p>

                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => setStep(2)}
                          className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSendEmails}
                          disabled={isSending}
                          className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                          {isSending ? 'Sending...' : 'Send Now'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Automation Logs */}
              {step === 1 && logs.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold text-navy-900 mb-4">Recent Sends</h3>
                  <div className="space-y-3">
                    {logs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                            log.status === 'partial' ? 'bg-amber-100 text-amber-600' :
                              log.status === 'failed' ? 'bg-rose-100 text-rose-600' :
                                'bg-slate-200 text-slate-500'
                            }`}>
                            {log.status === 'completed' ? <CheckCircle2 size={16} /> :
                              log.status === 'sending' ? <Loader2 size={16} className="animate-spin" /> :
                                <AlertCircle size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-navy-900">{log.template?.name || 'Unknown Template'}</p>
                            <p className="text-xs text-slate-500">{log.sentCount} sent, {log.failedCount} failed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400">
                            <Clock size={12} className="inline mr-1" />
                            {formatDate(log.createdAt)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${log.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            log.status === 'partial' ? 'bg-amber-50 text-amber-700' :
                              log.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Template Modal with Variable Panel */}
      <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={editingTemplate ? 'Edit Template' : 'Create Template'}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Template Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. Welcome Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Subject Line</label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Hello {{first_name}}!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Body Content</label>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={formBody}
                  onChange={setFormBody}
                  modules={quillModules}
                  placeholder="Dear {{client_name}},..."
                  className="bg-white"
                  style={{ minHeight: '200px' }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Use variables from the panel on the right</p>
            </div>
          </div>

          {/* Variable Reference Panel */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-navy-900 mb-3">Insert Variable</h4>
            <p className="text-xs text-slate-500 mb-4">Click to insert into body</p>
            <div className="space-y-2">
              {AVAILABLE_VARIABLES.map(v => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  className="w-full text-left px-3 py-2 text-xs bg-white border border-slate-200 rounded hover:border-teal-400 hover:bg-teal-50 transition-colors"
                >
                  <span className="font-mono text-teal-600">{v.key}</span>
                  <span className="block text-slate-500 mt-0.5">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-200 flex gap-3">
          <button onClick={() => setIsTemplateModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSaveTemplate}
            disabled={isSaving || !formName || !formBody}
            className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : editingTemplate ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Communications;