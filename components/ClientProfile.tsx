import React, { useState, useEffect } from 'react';
import { Client, Activity } from '../types';
import { MOCK_DOCS } from '../constants';
import { getClientById, subscribeToClientActivities } from '../services/db';
import { 
  Phone, Mail, Calendar, FileText, Shield, ChevronRight, 
  MessageSquare, Mic, Play, Bot, ChevronDown, ChevronUp, Download,
  Search, Filter, RefreshCw
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
  const [activities, setActivities] = useState<Activity[]>(initialClient.activities || []);
  
  // Modal States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');

  const tabs = [
    { id: 'history', label: 'History' },
    { id: 'docs', label: 'Documents' }
  ];

  useEffect(() => {
    // 1. Load full client data (including activities) from DB
    const loadData = async () => {
      const fullClient = await getClientById(initialClient.id);
      if (fullClient) {
        setClientData(fullClient);
        setActivities(fullClient.activities || []);
      }
    };
    loadData();

    // 2. Subscribe to Realtime Vapi updates from n8n
    const subscription = subscribeToClientActivities(initialClient.id, (newActivity) => {
      // Add new Vapi log to the top of the list instantly
      setActivities((prev) => [newActivity, ...prev]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialClient.id]);

  const toggleExpand = (id: string) => {
    setExpandedActivity(expandedActivity === id ? null : id);
  };

  const handleStartCall = () => {
    // Note: To make this fully functional, integrate Vapi SDK here.
    // Vapi.start() would go here.
    setIsCallModalOpen(true);
    setCallStatus('connecting');
    setTimeout(() => setCallStatus('connected'), 1500);
  };

  // ... (Keep existing Render functions: RenderAiCall, RenderHumanCall, RenderMessage)
  // Re-using RenderAiCall for brevity, but ensure it uses the 'activity' prop passed in
  const RenderAiCall = ({ activity }: { activity: Activity }) => {
    const isExpanded = expandedActivity === activity.id;
    return (
      <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-white border-teal-200 shadow-md ring-1 ring-teal-100' : 'bg-white border-slate-200 hover:border-teal-200'}`}>
        <div onClick={() => toggleExpand(activity.id)} className="p-4 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-navy-900">AI Voice Agent (Vapi)</h4>
                <span className="text-xs text-slate-400">• {new Date(activity.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-teal-600 transition-colors">
             {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        {isExpanded && activity.aiAnalysis && (
           <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-6">
              <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                     <Mic size={12} /> Call Summary
                  </h5>
                  <p className="text-sm text-navy-800">{activity.aiAnalysis.summary}</p>
              </div>
              {/* Transcript */}
              {activity.transcript && (
                <div className="border-t border-slate-200 pt-4">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Transcript</p>
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                      {/* Assuming transcript is stored as JSON array in DB */}
                      {Array.isArray(activity.transcript) && activity.transcript.map((line: any, i: number) => (
                         <div key={i} className="text-sm">
                            <span className="font-bold">{line.speaker}: </span>{line.text}
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
            <img src={clientData.imageUrl || 'https://via.placeholder.com/100'} className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-md" alt={clientData.name} />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-navy-900">{clientData.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700">
                  {clientData.status}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {clientData.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={14} /> {clientData.phone}</span>
                <span className="flex items-center gap-1.5"><Shield size={14} /> {clientData.advisor}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
               <Calendar size={16} /> Schedule
             </button>
             <button onClick={handleStartCall} className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 shadow-md transition-all">
               <Phone size={16} /> Call (Vapi)
             </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mt-10 -mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-navy-900'
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
                    <p className="text-slate-500 text-sm">Realtime feed from Vapi Voice Agents & n8n Workflows.</p>
                 </div>
              </div>

              <div className="space-y-8">
                 {activities.length === 0 && <p className="text-slate-500 text-center">No activities recorded yet.</p>}
                 {activities.map((activity) => (
                    <div key={activity.id}>
                       <RenderAiCall activity={activity} />
                    </div>
                 ))}
              </div>
           </div>
        )}
        
        {/* Placeholder for other tabs (Notes, Docs) reusing mock UI for now as specific DB logic wasn't requested for them, but structure is ready */}
        {activeTab === 'docs' && (
           <div className="animate-fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-100">
                       {MOCK_DOCS.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50">
                             <td className="px-6 py-4 flex items-center gap-3">
                                <FileText size={16} className="text-slate-400" />
                                <span className="text-sm font-medium text-navy-900">{doc.name}</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Schedule Appointment">
         <div className="p-4"><p>Scheduling via Calendar Service...</p></div>
      </Modal>
      <Modal isOpen={isCallModalOpen} onClose={() => setIsCallModalOpen(false)} title="Calling via Vapi...">
         <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
               <Phone size={40} />
            </div>
            <h3 className="text-xl font-bold text-navy-900">Connected to Voice AI</h3>
            <p className="text-slate-500 mb-8">Speaking with {clientData.name}...</p>
            <button onClick={() => setIsCallModalOpen(false)} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg">End Call</button>
         </div>
      </Modal>
    </div>
  );
};

export default ClientProfile;