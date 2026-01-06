import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import ClientProfile from './ClientProfile';
import Pipeline from './Pipeline';
import Workshops from './Workshops';
import Leads from './Leads';
import Clients from './Clients';
import CalendarView from './CalendarView';
import Documents from './Documents';
import Reports from './Reports';
import Communications from './Communications';
import Settings from './Settings';
import Team from './Team';
import Tasks from './Tasks';
import Modal from './Modal';
import { Search, Bell, Plus, X, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clientService } from '../services/client.service';
import { taskService } from '../services/task.service';
import { eventService } from '../services/event.service';
import { Client } from '../types';

const DashboardLayout: React.FC = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const [isQuickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState<'client' | 'task' | 'event'>('client');
    const { user } = useAuth();

    // Load client data when selectedClientId changes
    useEffect(() => {
        const loadClient = async () => {
            if (selectedClientId) {
                try {
                    const client = await clientService.getById(selectedClientId);
                    setSelectedClient(client);
                } catch (error) {
                    console.error('Failed to load client:', error);
                    setSelectedClientId(null);
                }
            } else {
                setSelectedClient(null);
            }
        };
        loadClient();
    }, [selectedClientId]);

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

    const renderContent = () => {
        if (selectedClient) {
            return <ClientProfile client={selectedClient} onBack={() => setSelectedClientId(null)} />;
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
            <div className="p-8 text-center text-slate-400">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">You're all caught up!</p>
            </div>
            <div className="p-3 bg-slate-50 text-center">
                <button className="text-xs font-medium text-slate-500 hover:text-navy-900">View All Activity</button>
            </div>
        </div>
    );

    const QuickAddForm = () => {
        const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
        const [formData, setFormData] = useState({
            name: '',
            email: '',
            phone: '',
            title: '',
            due: '',
            date: '',
            time: ''
        });

        const handleSubmit = async () => {
            setStatus('saving');
            try {
                if (quickAddType === 'client') {
                    await clientService.create({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        status: 'Lead'
                    });
                } else if (quickAddType === 'task') {
                    await taskService.create({
                        title: formData.title,
                        due: formData.due ? new Date(formData.due).toISOString() : undefined,
                        priority: 'Medium'
                    });
                } else if (quickAddType === 'event') {
                    const startDate = new Date(`${formData.date}T${formData.time || '09:00'}`);
                    const endDate = new Date(startDate.getTime() + 3600000); // +1 hour
                    await eventService.create({
                        title: formData.title,
                        start: startDate,
                        end: endDate,
                        type: 'Meeting'
                    });
                }
                setStatus('success');
                setTimeout(() => {
                    setQuickAddOpen(false);
                    setStatus('idle');
                    setFormData({ name: '', email: '', phone: '', title: '', due: '', date: '', time: '' });
                }, 1000);
            } catch (error) {
                console.error('Failed to create:', error);
                setStatus('error');
            }
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
                <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                    {(['client', 'task', 'event'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setQuickAddType(type)}
                            className={`flex-1 text-sm font-medium py-1.5 rounded-md capitalize ${quickAddType === type ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-800'
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
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Jonathan Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="jonathan@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </>
                )}

                {quickAddType === 'task' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Task Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Call regarding trust fund"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={formData.due}
                                onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    </>
                )}

                {quickAddType === 'event' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Event Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Q3 Review"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
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

                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
                    {renderContent()}
                </div>
            </main>

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

export default DashboardLayout;
