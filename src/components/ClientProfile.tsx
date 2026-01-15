import React, { useState, useEffect } from 'react';
import { Client, Activity, ClientPhone, ClientEmail, PhoneType, EmailType } from '../types';
import { activityService } from '../services/activity.service';
import { clientService } from '../services/client.service';
import { eventService } from '../services/event.service';
import { teamService, TeamMember } from '../services/team.service';
import { documentService, Document } from '../services/document.service';
import { noteService, Note } from '../services/note.service';
import {
  Phone, Mail, Calendar, FileText, Shield, ChevronRight,
  MessageSquare, Mic, Play, Bot, ChevronDown, ChevronUp, Download,
  Loader2, Volume2, UploadCloud, Edit2, Save, DollarSign, User,
  Copy, Check, Plus, Trash2, Star, X, Pin, StickyNote, Search
} from 'lucide-react';
import Modal from './Modal';

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
}

// Phone/Email Type Labels
const PHONE_TYPE_LABELS: Record<PhoneType, string> = {
  'HOME': 'Home',
  'WORK': 'Work',
  'CELLULAR': 'Cellular',
  'OTHER': 'Other'
};

const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  'HOME': 'Home',
  'HOME2': 'Home 2',
  'WORK': 'Work',
  'PERSONAL': 'Personal',
  'OTHER': 'Other'
};

const ClientProfile: React.FC<ClientProfileProps> = ({ client: initialClient, onBack }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [clientData, setClientData] = useState<Client>(initialClient);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Modal States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Notes State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'General' });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteSaveStatus, setNoteSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [noteSearch, setNoteSearch] = useState('');

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: initialClient.name,
    clientId: initialClient.clientId || '',
    status: initialClient.status,
    pipelineStage: initialClient.pipelineStage || '',
    aum: initialClient.aum || 0,
    riskProfile: initialClient.riskProfile || '',
    advisorId: initialClient.advisorId || '',
    tags: initialClient.tags?.join(', ') || ''
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [clientIdError, setClientIdError] = useState<string | null>(null);

  // Phone/Email Form State
  const [phoneForm, setPhoneForm] = useState<{ number: string; type: PhoneType; label: string; isPrimary: boolean; editId?: string }>({
    number: '',
    type: 'CELLULAR',
    label: '',
    isPrimary: false
  });
  const [emailForm, setEmailForm] = useState<{ email: string; type: EmailType; label: string; isPrimary: boolean; editId?: string }>({
    email: '',
    type: 'PERSONAL',
    label: '',
    isPrimary: false
  });
  const [contactSaveStatus, setContactSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Schedule Form State
  const [isScheduling, setIsScheduling] = useState(false);
  const [advisors, setAdvisors] = useState<TeamMember[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'Meeting' as 'Meeting' | 'Call' | 'Workshop',
    advisorId: ''
  });

  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        const members = await teamService.getAll();
        setAdvisors(members.filter(m => m.role === 'ADVISOR' || m.role === 'ADMIN'));
      } catch (error) {
        console.error('Failed to fetch advisors:', error);
      }
    };
    fetchAdvisors();
  }, []);

  const tabs = [
    { id: 'history', label: 'History' },
    { id: 'notes', label: 'Notes' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'docs', label: 'Documents' }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activitiesData, docsData, clientDetails, notesData] = await Promise.all([
          activityService.getByClient(initialClient.id),
          documentService.getAll(undefined, initialClient.id),
          clientService.getById(initialClient.id),
          noteService.getByClient(initialClient.id)
        ]);
        setActivities(activitiesData);
        setDocuments(docsData);
        if (clientDetails) {
          setClientData(clientDetails);
        }
        setNotes(notesData);
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

  const copyClientId = () => {
    navigator.clipboard.writeText(clientData.clientId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
    setClientIdError(null);

    try {
      // Validate clientId if changed
      if (editForm.clientId !== clientData.clientId) {
        const validation = await clientService.validateClientId(editForm.clientId, clientData.id);
        if (!validation.valid) {
          setClientIdError(validation.message || 'Invalid Client ID');
          setSaveStatus('idle');
          return;
        }
      }

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

  // Phone Management
  const handleSavePhone = async () => {
    setContactSaveStatus('saving');
    try {
      if (phoneForm.editId) {
        await clientService.updatePhone(phoneForm.editId, {
          number: phoneForm.number,
          type: phoneForm.type,
          label: phoneForm.label,
          isPrimary: phoneForm.isPrimary
        });
      } else {
        await clientService.addPhone(clientData.id, {
          number: phoneForm.number,
          type: phoneForm.type,
          label: phoneForm.label,
          isPrimary: phoneForm.isPrimary
        });
      }

      // Refresh client data
      const updated = await clientService.getById(clientData.id);
      setClientData(updated);
      setContactSaveStatus('success');
      setTimeout(() => {
        setIsPhoneModalOpen(false);
        setContactSaveStatus('idle');
        setPhoneForm({ number: '', type: 'CELLULAR', label: '', isPrimary: false });
      }, 1000);
    } catch (error) {
      console.error('Save phone failed:', error);
      setContactSaveStatus('error');
    }
  };

  const handleDeletePhone = async (phoneId: string) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;
    try {
      await clientService.deletePhone(phoneId);
      const updated = await clientService.getById(clientData.id);
      setClientData(updated);
    } catch (error) {
      console.error('Delete phone failed:', error);
    }
  };

  const handleSetPrimaryPhone = async (phoneId: string) => {
    try {
      await clientService.setPrimaryPhone(clientData.id, phoneId);
      const updated = await clientService.getById(clientData.id);
      setClientData(updated);
    } catch (error) {
      console.error('Set primary phone failed:', error);
    }
  };

  // Email Management
  const handleSaveEmail = async () => {
    setContactSaveStatus('saving');
    try {
      if (emailForm.editId) {
        await clientService.updateEmail(emailForm.editId, {
          email: emailForm.email,
          type: emailForm.type,
          label: emailForm.label,
          isPrimary: emailForm.isPrimary
        });
      } else {
        await clientService.addEmail(clientData.id, {
          email: emailForm.email,
          type: emailForm.type,
          label: emailForm.label,
          isPrimary: emailForm.isPrimary
        });
      }

      const updated = await clientService.getById(clientData.id);
      setClientData(updated);
      setContactSaveStatus('success');
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setContactSaveStatus('idle');
        setEmailForm({ email: '', type: 'PERSONAL', label: '', isPrimary: false });
      }, 1000);
    } catch (error) {
      console.error('Save email failed:', error);
      setContactSaveStatus('error');
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email address?')) return;
    try {
      await clientService.deleteEmail(emailId);
      const updated = await clientService.getById(clientData.id);
      setClientData(updated);
    } catch (error) {
      console.error('Delete email failed:', error);
    }
  };

  const handleSetPrimaryEmail = async (emailId: string) => {
    try {
      await clientService.setPrimaryEmail(clientData.id, emailId);
      const updated = await clientService.getById(clientData.id);
      setClientData(updated);
    } catch (error) {
      console.error('Set primary email failed:', error);
    }
  };

  // Get primary contact info
  const primaryPhone = clientData.phones?.find(p => p.isPrimary)?.number || clientData.phones?.[0]?.number || clientData.phone;
  const primaryEmail = clientData.emails?.find(e => e.isPrimary)?.email || clientData.emails?.[0]?.email || clientData.email;

  const RenderAiCall = ({ activity }: { activity: Activity }) => {
    const isExpanded = expandedActivity === activity.id;
    const analysis = activity.aiAnalysis as any;
    const transcript = activity.transcript as any[];
    const hasRecording = !!activity.recordingUrl;
    const hasTranscript = transcript && transcript.length > 0;
    const hasAnalysis = !!analysis;

    return (
      <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white border-teal-200 shadow-md ring-1 ring-teal-100' : 'bg-white border-slate-200 hover:border-teal-200'}`}>
        <div onClick={() => toggleExpand(activity.id)} className="p-4 flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0 ${activity.subType === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-500'}`}>
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-navy-900">{activity.subType === 'ai' ? 'AI Voice Agent (Vapi)' : 'Call Log'}</h4>
                <span className="text-xs text-slate-400">• {new Date(activity.date).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">{activity.description || 'No description available'}</p>
              <div className="flex gap-2 mt-1">
                {hasRecording && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1"><Volume2 size={10} /> Audio</span>}
                {hasTranscript && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1"><FileText size={10} /> Transcript</span>}
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 text-slate-400 group-hover:text-teal-600 transition-colors text-sm font-medium">
            {isExpanded ? 'Collapse' : 'View Details'}
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        {isExpanded && (
          <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-6">
            {!hasRecording && !hasAnalysis && !hasTranscript && (
              <p className="text-sm text-slate-500 italic text-center">No additional details available for this call.</p>
            )}

            {activity.recordingUrl && (
              <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
                <Volume2 size={18} className="text-slate-500" />
                <audio controls className="flex-1 h-8">
                  <source src={activity.recordingUrl} type="audio/mpeg" />
                </audio>
              </div>
            )}
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
            {transcript && transcript.length > 0 ? (
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
            ) : (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Transcript</p>
                <p className="text-sm text-slate-400 italic">No transcript available for this call.</p>
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
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 shadow-sm z-10">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-navy-900 mb-4 flex items-center gap-1 transition-colors">
          <ChevronRight size={14} className="rotate-180" /> Back to List
        </button>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex gap-4 md:gap-6 items-start">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-50 shadow-md bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl md:text-2xl flex-shrink-0">
              {clientData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-navy-900">{clientData.name}</h1>
                {/* Client ID Badge */}
                <button
                  onClick={copyClientId}
                  className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 hover:bg-teal-50 rounded-md text-xs font-mono text-slate-600 hover:text-teal-700 transition-colors"
                  title="Click to copy Client ID"
                >
                  {clientData.clientId}
                  {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
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
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-500">
                {primaryEmail && <span className="flex items-center gap-1.5"><Mail size={14} /> {primaryEmail}</span>}
                {primaryPhone && <span className="flex items-center gap-1.5"><Phone size={14} /> {primaryPhone}</span>}
                {clientData.advisor && <span className="flex items-center gap-1.5"><User size={14} /> {clientData.advisor}</span>}
              </div>
              {clientData.tags && clientData.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
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
        <div className="flex gap-6 md:gap-8 mt-8 md:mt-10 -mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* History Tab */}
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

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-navy-900">Client Notes</h2>
                <p className="text-slate-500 text-sm">Keep track of important information and conversations.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none w-48"
                  />
                </div>
                <button
                  onClick={() => {
                    setNoteForm({ title: '', content: '', category: 'General' });
                    setEditingNoteId(null);
                    setIsNoteModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  <Plus size={16} /> Add Note
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-navy-900" size={32} />
              </div>
            ) : notes.filter(n =>
              n.title?.toLowerCase().includes(noteSearch.toLowerCase()) ||
              n.content.toLowerCase().includes(noteSearch.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <StickyNote size={28} className="text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">No notes yet</h3>
                <p className="text-slate-500 text-sm mb-4">Start documenting important client information.</p>
                <button
                  onClick={() => {
                    setNoteForm({ title: '', content: '', category: 'General' });
                    setEditingNoteId(null);
                    setIsNoteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  <Plus size={16} /> Create First Note
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {notes
                  .filter(n => n.title?.toLowerCase().includes(noteSearch.toLowerCase()) || n.content.toLowerCase().includes(noteSearch.toLowerCase()))
                  .map((note) => {
                    const categoryColors: Record<string, string> = {
                      'General': 'bg-slate-100 text-slate-600',
                      'Meeting': 'bg-blue-100 text-blue-700',
                      'Call': 'bg-amber-100 text-amber-700',
                      'Financial': 'bg-emerald-100 text-emerald-700',
                      'Personal': 'bg-purple-100 text-purple-700'
                    };
                    const timeDiff = (Date.now() - new Date(note.createdAt).getTime()) / 1000;
                    let timeAgo = '';
                    if (timeDiff < 3600) timeAgo = `${Math.floor(timeDiff / 60)}m ago`;
                    else if (timeDiff < 86400) timeAgo = `${Math.floor(timeDiff / 3600)}h ago`;
                    else if (timeDiff < 604800) timeAgo = `${Math.floor(timeDiff / 86400)}d ago`;
                    else timeAgo = new Date(note.createdAt).toLocaleDateString();

                    return (
                      <div
                        key={note.id}
                        className={`group relative rounded-xl border bg-white p-5 transition-all duration-200 hover:shadow-md ${note.isPinned ? 'border-amber-200 bg-amber-50/30 ring-1 ring-amber-100' : 'border-slate-200 hover:border-teal-200'
                          }`}
                      >
                        {note.isPinned && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                            <Pin size={12} className="text-white" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {note.title && <h4 className="font-semibold text-navy-900">{note.title}</h4>}
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[note.category || 'General'] || categoryColors['General']}`}>
                                {note.category || 'General'}
                              </span>
                            </div>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{note.content}</p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                              <span>{note.author?.name || 'Unknown'}</span>
                              <span>•</span>
                              <span>{timeAgo}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                // Optimistic UI update - flip immediately
                                setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isPinned: !n.isPinned } : n).sort((a, b) => {
                                  if (a.isPinned && !b.isPinned) return -1;
                                  if (!a.isPinned && b.isPinned) return 1;
                                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                }));
                                // Update server in background
                                noteService.togglePin(note.id).catch(err => {
                                  console.error('Failed to toggle pin:', err);
                                  // Revert on error
                                  setNotes(prev => prev.map(n => n.id === note.id ? { ...n, isPinned: note.isPinned } : n));
                                });
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${note.isPinned ? 'text-amber-500 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100 hover:text-amber-500'}`}
                              title={note.isPinned ? 'Unpin note' : 'Pin note'}
                            >
                              <Pin size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setNoteForm({ title: note.title || '', content: note.content, category: note.category || 'General' });
                                setEditingNoteId(note.id);
                                setIsNoteModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors"
                              title="Edit note"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this note?')) {
                                  await noteService.delete(note.id);
                                  setNotes(prev => prev.filter(n => n.id !== note.id));
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Delete note"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone Numbers Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                    <Phone size={18} className="text-teal-600" /> Phone Numbers
                  </h3>
                  <button
                    onClick={() => {
                      setPhoneForm({ number: '', type: 'CELLULAR', label: '', isPrimary: false });
                      setIsPhoneModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(!clientData.phones || clientData.phones.length === 0) && (
                    <p className="text-slate-400 text-sm text-center py-4">No phone numbers added</p>
                  )}
                  {clientData.phones?.map(phone => (
                    <div key={phone.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                      <div className="flex items-center gap-3">
                        {phone.isPrimary && <Star size={14} className="text-amber-500 fill-amber-500" />}
                        <div>
                          <p className="font-medium text-navy-900">{phone.number}</p>
                          <p className="text-xs text-slate-500">{PHONE_TYPE_LABELS[phone.type]}{phone.label && ` • ${phone.label}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!phone.isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryPhone(phone.id)}
                            className="p-1 text-slate-400 hover:text-amber-500"
                            title="Set as Primary"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPhoneForm({
                              number: phone.number,
                              type: phone.type,
                              label: phone.label || '',
                              isPrimary: phone.isPrimary,
                              editId: phone.id
                            });
                            setIsPhoneModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-teal-600"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePhone(phone.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Addresses Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                    <Mail size={18} className="text-teal-600" /> Email Addresses
                  </h3>
                  <button
                    onClick={() => {
                      setEmailForm({ email: '', type: 'PERSONAL', label: '', isPrimary: false });
                      setIsEmailModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {(!clientData.emails || clientData.emails.length === 0) && (
                    <p className="text-slate-400 text-sm text-center py-4">No email addresses added</p>
                  )}
                  {clientData.emails?.map(email => (
                    <div key={email.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
                      <div className="flex items-center gap-3">
                        {email.isPrimary && <Star size={14} className="text-amber-500 fill-amber-500" />}
                        <div>
                          <p className="font-medium text-navy-900 break-all">{email.email}</p>
                          <p className="text-xs text-slate-500">{EMAIL_TYPE_LABELS[email.type]}{email.label && ` • ${email.label}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!email.isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryEmail(email.id)}
                            className="p-1 text-slate-400 hover:text-amber-500"
                            title="Set as Primary"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEmailForm({
                              email: email.email,
                              type: email.type,
                              label: email.label || '',
                              isPrimary: email.isPrimary,
                              editId: email.id
                            });
                            setIsEmailModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-teal-600"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmail(email.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
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
                            onClick={() => documentService.download(doc.id, doc.name)}
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

      {/* Edit Client Modal */}
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client ID</label>
              <input
                type="text"
                value={editForm.clientId}
                onChange={(e) => {
                  setEditForm(prev => ({ ...prev, clientId: e.target.value.toUpperCase() }));
                  setClientIdError(null);
                }}
                placeholder="CL-0001"
                className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none ${clientIdError ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
              />
              {clientIdError && <p className="text-xs text-red-500 mt-1">{clientIdError}</p>}
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
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Advisor</label>
              <select
                value={editForm.advisorId}
                onChange={(e) => setEditForm(prev => ({ ...prev, advisorId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">-- None --</option>
                {advisors.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>{advisor.name}</option>
                ))}
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
          <p className="text-xs text-slate-400">To manage phone numbers and emails, use the Contacts tab.</p>
          <button
            onClick={handleSaveClient}
            disabled={saveStatus !== 'idle'}
            className={`w-full py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${saveStatus === 'success' ? 'bg-emerald-600 text-white' :
              saveStatus === 'error' ? 'bg-red-600 text-white' :
                'bg-teal-600 text-white hover:bg-teal-700'
              }`}
          >
            {saveStatus === 'idle' && <><Save size={16} /> Save Changes</>}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'success' && 'Saved!'}
            {saveStatus === 'error' && 'Failed - Try Again'}
          </button>
        </div>
      </Modal>

      {/* Phone Modal */}
      <Modal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} title={phoneForm.editId ? 'Edit Phone' : 'Add Phone'}>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneForm.number}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, number: e.target.value }))}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select
                value={phoneForm.type}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, type: e.target.value as PhoneType }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="CELLULAR">Cellular</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Label (Optional)</label>
              <input
                type="text"
                value={phoneForm.label}
                onChange={(e) => setPhoneForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Main Office"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={phoneForm.isPrimary}
              onChange={(e) => setPhoneForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">Set as primary phone</span>
          </label>
          <button
            onClick={handleSavePhone}
            disabled={!phoneForm.number || contactSaveStatus === 'saving'}
            className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {contactSaveStatus === 'saving' ? 'Saving...' : contactSaveStatus === 'success' ? 'Saved!' : 'Save Phone'}
          </button>
        </div>
      </Modal>

      {/* Email Modal */}
      <Modal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title={emailForm.editId ? 'Edit Email' : 'Add Email'}>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={emailForm.email}
              onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
              <select
                value={emailForm.type}
                onChange={(e) => setEmailForm(prev => ({ ...prev, type: e.target.value as EmailType }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="HOME">Home</option>
                <option value="HOME2">Home 2</option>
                <option value="WORK">Work</option>
                <option value="PERSONAL">Personal</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Label (Optional)</label>
              <input
                type="text"
                value={emailForm.label}
                onChange={(e) => setEmailForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Primary"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailForm.isPrimary}
              onChange={(e) => setEmailForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700">Set as primary email</span>
          </label>
          <button
            onClick={handleSaveEmail}
            disabled={!emailForm.email || contactSaveStatus === 'saving'}
            className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {contactSaveStatus === 'saving' ? 'Saving...' : contactSaveStatus === 'success' ? 'Saved!' : 'Save Email'}
          </button>
        </div>
      </Modal>

      {/* Upload Document Modal */}
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
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${uploadStatus === 'success' ? 'bg-emerald-600 text-white' :
                uploadStatus === 'error' ? 'bg-red-600 text-white' :
                  'bg-teal-600 text-white hover:bg-teal-700'
                }`}
            >
              {uploadStatus === 'idle' && 'Upload'}
              {uploadStatus === 'uploading' && 'Uploading...'}
              {uploadStatus === 'success' && 'Uploaded!'}
              {uploadStatus === 'error' && 'Failed - Try Again'}
            </button>
          )}
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
              clientId: clientData.id,
              advisorId: scheduleForm.advisorId
            });
            setIsScheduleModalOpen(false);
            setScheduleForm(prev => ({ ...prev, title: '' }));
            const newActivities = await activityService.getByClient(clientData.id);
            setActivities(newActivities);
          } catch (error) {
            console.error('Failed to schedule:', error);
            alert('Failed to schedule appointment.');
          } finally {
            setIsScheduling(false);
          }
        }} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Appointment Title</label>
            <input
              type="text"
              value={scheduleForm.title}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`Meeting with ${clientData.name}`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
              <input
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
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Advisor</label>
            <select
              value={scheduleForm.advisorId}
              onChange={(e) => setScheduleForm(prev => ({ ...prev, advisorId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select Advisor...</option>
              {advisors.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors" disabled={isScheduling}>Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2" disabled={isScheduling}>
              {isScheduling ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
              {isScheduling ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Note Modal */}
      <Modal isOpen={isNoteModalOpen} onClose={() => { setIsNoteModalOpen(false); setEditingNoteId(null); }} title={editingNoteId ? 'Edit Note' : 'Add Note'}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!noteForm.content.trim()) return;
          setNoteSaveStatus('saving');
          try {
            if (editingNoteId) {
              const updated = await noteService.update(editingNoteId, {
                title: noteForm.title || undefined,
                content: noteForm.content,
                category: noteForm.category
              });
              setNotes(prev => prev.map(n => n.id === editingNoteId ? updated : n));
            } else {
              const created = await noteService.create({
                clientId: initialClient.id,
                title: noteForm.title || undefined,
                content: noteForm.content,
                category: noteForm.category
              });
              setNotes(prev => [created, ...prev]);
            }
            setNoteSaveStatus('success');
            setTimeout(() => {
              setIsNoteModalOpen(false);
              setEditingNoteId(null);
              setNoteSaveStatus('idle');
              setNoteForm({ title: '', content: '', category: 'General' });
            }, 500);
          } catch (error) {
            console.error('Failed to save note:', error);
            setNoteSaveStatus('error');
          }
        }} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (Optional)</label>
            <input
              type="text"
              value={noteForm.title}
              onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Note title..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
            <select
              value={noteForm.category}
              onChange={(e) => setNoteForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="General">General</option>
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Financial">Financial</option>
              <option value="Personal">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content *</label>
            <textarea
              value={noteForm.content}
              onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your note here..."
              rows={5}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{noteForm.content.length} characters</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsNoteModalOpen(false); setEditingNoteId(null); }}
              className="flex-1 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
              disabled={noteSaveStatus === 'saving'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={noteSaveStatus === 'saving' || !noteForm.content.trim()}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {noteSaveStatus === 'saving' ? (
                <><Loader2 size={16} className="animate-spin" /> Saving...</>
              ) : noteSaveStatus === 'success' ? (
                <><Check size={16} /> Saved!</>
              ) : (
                <><Save size={16} /> {editingNoteId ? 'Update Note' : 'Save Note'}</>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientProfile;
