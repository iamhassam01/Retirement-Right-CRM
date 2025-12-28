import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientProfile from './components/ClientProfile';
import Pipeline from './components/Pipeline';
import Workshops from './components/Workshops';
import Leads from './components/Leads';
import Clients from './components/Clients';
import CalendarView from './components/CalendarView';
import Documents from './components/Documents';
import Reports from './components/Reports';
import Communications from './components/Communications';
import Settings from './components/Settings';
import Team from './components/Team';
import Tasks from './components/Tasks';
import Modal from './components/Modal';
import { MOCK_CLIENTS } from './constants';
import { Search, Bell, Plus, X, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  // Modal States
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'client' | 'task' | 'event'>('client');

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef]);

  // Simple Router Logic
  const renderContent = () => {
    if (selectedClientId) {
      const client = MOCK_CLIENTS.find(c => c.id === selectedClientId);
      if (client) {
        return <ClientProfile client={client} onBack={() => setSelectedClientId(null)} />;
      }
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentView} onSelectClient={setSelectedClientId} />;
      case 'pipeline':
        return <Pipeline />;
      case 'tasks':
        return <Tasks />;
      case 'workshops':
        return <Workshops />;
      case 'leads':
        return <Leads onSelectClient={setSelectedClientId} />;
      case 'clients':
        return <Clients onSelectClient={setSelectedClientId} />;
      case 'calendar':
        return <CalendarView />;
      case 'documents':
        return <Documents />;
      case 'reports':
        return <Reports />;
      case 'communications':
        return <Communications />;
      case 'settings':
        return <Settings />;
      case 'team':
        return <Team />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <h3 className="text-lg font-medium text-navy-900">404</h3>
              <p>Module not found.</p>
            </div>
          </div>
        );
    }
  };

  const NotificationsDropdown = () => (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-navy-900">Notifications</h3>
        <button className="text-xs text-teal-600 hover:underline">Mark all read</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {[
          { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Task Completed', desc: 'RMD distribution for Sterling confirmed.', time: '10m ago' },
          { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Compliance Alert', desc: 'Trust document for Finch requires review.', time: '1h ago' },
          { icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50', title: 'Upcoming Meeting', desc: 'Review with Robert & Martha in 30 mins.', time: '30m ago' },
        ].map((notif, i) => (
          <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.bg} ${notif.color}`}>
              <notif.icon size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">{notif.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
              <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-slate-50 text-center">
        <button className="text-xs font-medium text-slate-500 hover:text-navy-900">View All Activity</button>
      </div>
    </div>
  );

  const QuickAddForm = () => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const handleSubmit = () => {
      setStatus('saving');
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
          setQuickAddOpen(false);
          setStatus('idle');
        }, 1000);
      }, 800);
    };

    if (status === 'success') {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-navy-900">Successfully Added!</h3>
          <p className="text-slate-500">The new {quickAddType} has been created.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Toggle Type */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          {(['client', 'task', 'event'] as const).map(type => (
             <button
                key={type}
                onClick={() => setQuickAddType(type)}
                className={`flex-1 text-sm font-medium py-1.5 rounded-md capitalize ${
                  quickAddType === type ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-800'
                }`}
             >
                {type}
             </button>
          ))}
        </div>

        {quickAddType === 'client' && (
          <>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Full Name</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Jonathan Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="jonathan@example.com" />
            </div>
          </>
        )}
        
        {quickAddType === 'task' && (
          <>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Task Title</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Call regarding trust fund" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Due Date</label>
              <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </>
        )}

        {quickAddType === 'event' && (
           <>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Event Title</label>
              <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Q3 Review" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
                 <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
                 <input type="time" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
               </div>
            </div>
          </>
        )}

        <div className="pt-4">
           <button 
             onClick={handleSubmit}
             disabled={status === 'saving'}
             className="w-full bg-navy-900 hover:bg-navy-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
           >
             {status === 'saving' ? 'Creating...' : `Create ${quickAddType}`}
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F0F4F8] font-sans text-slate-600">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
          setCurrentView(view);
          setSelectedClientId(null);
        }} 
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Global Top Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-40 shrink-0">
          <div className="flex items-center w-96 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all group shadow-sm">
            <Search size={18} className="text-slate-400 mr-3 group-focus-within:text-teal-600" />
            <input 
              type="text" 
              placeholder="Search clients, documents, or events..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-navy-900"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative text-slate-400 hover:text-navy-900 transition-colors p-2.5 rounded-full hover:bg-slate-50 ${isNotificationsOpen ? 'bg-slate-100 text-navy-900' : ''}`}
              >
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              {isNotificationsOpen && <NotificationsDropdown />}
            </div>
            
            <div className="h-8 w-px bg-slate-200"></div>
            
            <button 
              onClick={() => setQuickAddOpen(true)}
              className="bg-navy-900 hover:bg-navy-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-navy-900/10 hover:shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Plus size={18} /> Quick Add
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
          {renderContent()}
        </div>
      </main>

      {/* Global Modals */}
      <Modal 
        isOpen={isQuickAddOpen} 
        onClose={() => setQuickAddOpen(false)}
        title="Add to Workspace"
      >
        <QuickAddForm />
      </Modal>
    </div>
  );
};

export default App;