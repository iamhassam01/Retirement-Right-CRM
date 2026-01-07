import React, { useState, useEffect } from 'react';
import { Client, Activity } from '../types';
import { activityService } from '../services/activity.service';
import { clientService } from '../services/client.service';
import { eventService } from '../services/event.service';
import { documentService, Document } from '../services/document.service';
import {
  Phone, Mail, Calendar, FileText, Shield, ChevronRight,
  MessageSquare, Mic, Play, Bot, ChevronDown, ChevronUp, Download,
  Loader2, Volume2, UploadCloud, Edit2, Save, DollarSign, User
} from 'lucide-react';
import Modal from './Modal';

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client: initialClient, onBack }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [clientData, setClientData] = useState<Client>(initialClient);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [editForm, setEditForm] = useState({
    name: initialClient.name,
    email: initialClient.email || '',
    phone: initialClient.phone || '',
    status: initialClient.status,
    pipelineStage: initialClient.pipelineStage || '',
    aum: initialClient.aum || 0,
    riskProfile: initialClient.riskProfile || '',
    tags: initialClient.tags?.join(', ') || ''
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'Meeting' as 'Meeting' | 'Call' | 'Workshop'
  });

  const tabs = [
    { id: 'history', label: 'History' },
    { id: 'docs', label: 'Documents' }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activitiesData, docsData] = await Promise.all([
          activityService.getByClient(initialClient.id),
          documentService.getAll(undefined, initialClient.id)
        ]);
        setActivities(activitiesData);
        setDocuments(docsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [initialClient.id]);

  const toggleExpand = (id: string) => {
    setExpandedActivity(expandedActivity === id ? null : id);
  };



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) return;
    setUploadStatus('uploading');
    try {
      const newDoc = await documentService.upload(selectedFile, 'Client', initialClient.id);
      setDocuments(prev => [newDoc, ...prev]);
      setUploadStatus('success');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus('idle');
        setSelectedFile(null);
      }, 1500);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
    }
  };

  const handleSaveClient = async () => {
    setSaveStatus('saving');
    try {
      const updatedData = {
        ...editForm,
        aum: parseFloat(String(editForm.aum)) || 0,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      const updated = await clientService.update(initialClient.id, updatedData as any);
      setClientData(prev => ({ ...prev, ...updated }));
      setSaveStatus('success');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
    }
  };

  const RenderAiCall = ({ activity }: { activity: Activity }) => {
    const isExpanded = expandedActivity === activity.id;
    const analysis = activity.aiAnalysis as any;
    const transcript = activity.transcript as any[];

    return (
      <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white border-teal-200 shadow-md ring-1 ring-teal-100' : 'bg-white border-slate-200 hover:border-teal-200'}`}>
        <div onClick={() => toggleExpand(activity.id)} className="p-4 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-navy-900">AI Voice Agent (Vapi)</h4>
                <span className="text-xs text-slate-400">• {new Date(activity.date).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-teal-600 transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        {isExpanded && (
          <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-6">
            {/* Audio Player */}
            {activity.recordingUrl && (
              <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
                <Volume2 size={18} className="text-slate-500" />
                <audio controls className="flex-1 h-8">
                  <source src={activity.recordingUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* AI Summary */}
            {analysis && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Mic size={12} /> AI Analysis
                </h5>
                <p className="text-sm text-navy-800">{typeof analysis.summary === 'string' ? analysis.summary : JSON.stringify(analysis.summary)}</p>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">Intent: {analysis.intent || 'N/A'}</span>
                  <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">Sentiment: {analysis.sentiment || 'N/A'}</span>
                </div>
              </div>
            )}

            {/* Transcript */}
            {transcript && transcript.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Transcript</p>
                <div className="space-y-2 max-h-60 overflow-y-auto bg-white p-3 rounded-lg border border-slate-200">
                  {transcript.map((line: any, i: number) => (
                    <div key={i} className="text-sm">
                      <span className={`font-bold ${line.speaker === 'AI' ? 'text-indigo-600' : 'text-slate-700'}`}>{line.speaker}: </span>
                      <span className="text-slate-600">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm z-10">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-navy-900 mb-4 flex items-center gap-1 transition-colors">
          <ChevronRight size={14} className="rotate-180" /> Back to List
        </button>

        <div className="flex justify-between items-start">
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
              {clientData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-navy-900">{clientData.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700">
                  {clientData.status}
                </span>
                {clientData.riskProfile && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${clientData.riskProfile === 'Conservative' ? 'bg-blue-50 text-blue-700' :
                    clientData.riskProfile === 'Moderate' ? 'bg-amber-50 text-amber-700' :
                      'bg-rose-50 text-rose-700'
                    }`}>
                    {clientData.riskProfile}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {clientData.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={14} /> {clientData.phone}</span>
                <span className="flex items-center gap-1.5"><User size={14} /> {clientData.advisor || 'No advisor'}</span>
              </div>
              {clientData.tags && clientData.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {clientData.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Edit2 size={16} /> Edit
            </button>
            <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <Calendar size={16} /> Schedule
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mt-10 -mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-navy-900">Communication Timeline</h2>
                <p className="text-slate-500 text-sm">Realtime feed from Vapi Voice Agents.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-navy-900" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                {activities.length === 0 && <p className="text-slate-500 text-center py-8">No activities recorded yet.</p>}
                {activities.map((activity) => (
                  <RenderAiCall key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-navy-900">Client Documents</h3>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <UploadCloud size={16} /> Upload Document
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {documents.length > 0 ? (
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-sm font-medium text-navy-900">{doc.name}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{doc.size}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => documentService.download(doc.id)}
                            className="text-teal-600 hover:text-teal-700 text-sm"
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={32} className="mx-auto mb-2" />
                  <p>No documents uploaded for this client</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Schedule Appointment">
        <div className="p-4"><p>Scheduling via Calendar Service...</p></div>
      </Modal>

      <Modal isOpen={isUploadModalOpen} onClose={() => { setIsUploadModalOpen(false); setSelectedFile(null); setUploadStatus('idle'); }} title="Upload Document">
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-500">Upload a document for {clientData.name}</p>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="client-file-upload"
            />
            <label htmlFor="client-file-upload" className="cursor-pointer">
              <UploadCloud size={32} className="mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600">
                {selectedFile ? selectedFile.name : 'Click to select a file'}
              </p>
            </label>
          </div>
          {selectedFile && (
            <button
              onClick={handleUploadDocument}
              disabled={uploadStatus !== 'idle'}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${uploadStatus === 'success' ? 'bg-emerald-600 text-white' : uploadStatus === 'error' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
              {uploadStatus === 'idle' && 'Upload'}
              {uploadStatus === 'uploading' && 'Uploading...'}
              {uploadStatus === 'success' && 'Uploaded!'}
              {uploadStatus === 'error' && 'Failed - Try Again'}
            </button>
          )}
        </div>
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Client Profile">
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Lead">Lead</option>
                <option value="Prospect">Prospect</option>
                <option value="Active">Active</option>
                <option value="Churned">Churned</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pipeline Stage</label>
              <select
                value={editForm.pipelineStage}
                onChange={(e) => setEditForm(prev => ({ ...prev, pipelineStage: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="New Lead">New Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Appointment Booked">Appointment Booked</option>
                <option value="Attended">Attended</option>
                <option value="Proposal">Proposal</option>
                <option value="Client Onboarded">Client Onboarded</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">AUM ($)</label>
              <input
                type="number"
                value={editForm.aum}
                onChange={(e) => setEditForm(prev => ({ ...prev, aum: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Risk Profile</label>
              <select
                value={editForm.riskProfile}
                onChange={(e) => setEditForm(prev => ({ ...prev, riskProfile: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Retiree, Golfer, High Net Worth"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleSaveClient}
            disabled={saveStatus !== 'idle'}
            className={`w-full py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${saveStatus === 'success' ? 'bg-emerald-600 text-white' : saveStatus === 'error' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
          >
            {saveStatus === 'idle' && <><Save size={16} /> Save Changes</>}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'success' && 'Saved!'}
            {saveStatus === 'error' && 'Failed - Try Again'}
          </button>
        </div>
      </Modal>

      {/* Schedule Appointment Modal */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => { setIsScheduleModalOpen(false); setScheduleForm(prev => ({ ...prev, title: '' })); }} title="Schedule Appointment">
        <form onSubmit={async (e) => {
          e.preventDefault();
          setIsScheduling(true);
          try {
            const start = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            await eventService.create({
              title: scheduleForm.title || `Meeting with ${clientData.name}`,
              start,
              end,
              type: scheduleForm.type,
              clientId: clientData.id
            });
            setIsScheduleModalOpen(false);
            setScheduleForm(prev => ({ ...prev, title: '' }));
            // Refresh activities
            const newActivities = await activityService.getByClient(clientData.id);
            setActivities(newActivities);
          } catch (error) {
            console.error('Failed to schedule:', error);
            alert('Failed to schedule appointment.');
          } finally {
            setIsScheduling(false);
          }
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Title</label>
            <input
              type="text"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Meeting with ${clientData.name}`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Client</label>
            <input
              type="text"
              value={clientData.name}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
              <input
                name="date"
                type="date"
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
              <input
                name="time"
                type="time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Type</label>
            <select
              value={scheduleForm.type}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
          {clientData.phone && (
            <p className="text-xs text-slate-500"> Client phone: {clientData.phone}</p>
          )}
          {clientData.email && (
            <p className="text-xs text-slate-500"> Client email: {clientData.email}</p>
          )}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors" disabled={isScheduling}>Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2" disabled={isScheduling}>
              {isScheduling ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
              {isScheduling ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientProfile;
