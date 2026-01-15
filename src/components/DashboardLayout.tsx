import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import ClientProfile from './ClientProfile';
import Pipeline from './Pipeline';
import Workshops from './Workshops';
import Leads from './Leads';
import Clients from './Clients';
import ImportWizard from './ImportWizard';
import CalendarView from './CalendarView';
import Documents from './Documents';
import Reports from './Reports';
import Communications from './Communications';
import Settings from './Settings';
import Team from './Team';
import Tasks from './Tasks';
import ActivityLog from './ActivityLog';
import Modal from './Modal';
import { Search, Bell, Plus, X, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clientService } from '../services/client.service';
import { taskService } from '../services/task.service';
import { eventService } from '../services/event.service';
import { notificationService, Notification } from '../services/notification.service';
import { Client } from '../types';

const DashboardLayout: React.FC = () => {
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const [isQuickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddType, setQuickAddType] = useState<'client' | 'task' | 'event' | 'appointment'>('client');
    const [quickAddClients, setQuickAddClients] = useState<Client[]>([]);
    const [quickAddAdvisors, setQuickAddAdvisors] = useState<{ id: string, name: string }[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const hasFetchedNotifications = useRef(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{
        clients: Client[];
        events: any[];
        workshops: any[];
    }>({ clients: [], events: [], workshops: [] });
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
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

    // Periodic notification polling every 30 seconds + initial fetch
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationService.getAll();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        // Initial fetch
        fetchNotifications();

        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch clients and advisors when Quick Add opens
    useEffect(() => {
        if (isQuickAddOpen) {
            const fetchData = async () => {
                try {
                    const [clients, advisors] = await Promise.all([
                        clientService.getAll(),
                        import('../services/team.service').then(m => m.teamService.getAll())
                    ]);
                    setQuickAddClients(clients);
                    setQuickAddAdvisors(advisors.map((a: any) => ({ id: a.id, name: a.name })));
                } catch (e) {
                    console.error('Failed to fetch data for Quick Add:', e);
                }
            };
            fetchData();
        }
    }, [isQuickAddOpen]);

    // Search handler with debounce - searches clients, events, and workshops
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        if (query.length < 2) {
            setSearchResults({ clients: [], events: [], workshops: [] });
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const queryLower = query.toLowerCase();

                // Fetch all data sources
                const [clients, events, workshops] = await Promise.all([
                    clientService.getAll().catch(() => []),
                    import('../services/event.service').then(m => m.eventService.getAll()).catch(() => []),
                    import('../services/workshop.service').then(m => m.workshopService.getAll()).catch(() => [])
                ]);

                // Filter clients
                const filteredClients = clients.filter((c: Client) =>
                    c.name?.toLowerCase().includes(queryLower) ||
                    c.email?.toLowerCase().includes(queryLower)
                ).slice(0, 3);

                // Filter events
                const filteredEvents = events.filter((e: any) =>
                    e.title?.toLowerCase().includes(queryLower) ||
                    e.type?.toLowerCase().includes(queryLower) ||
                    e.clientName?.toLowerCase().includes(queryLower)
                ).slice(0, 3);

                // Filter workshops
                const filteredWorkshops = workshops.filter((w: any) =>
                    w.title?.toLowerCase().includes(queryLower) ||
                    w.location?.toLowerCase().includes(queryLower)
                ).slice(0, 3);

                setSearchResults({
                    clients: filteredClients,
                    events: filteredEvents,
                    workshops: filteredWorkshops
                });
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

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
                return <Clients onSelectClient={setSelectedClientId} onOpenImport={() => setIsImportOpen(true)} />;
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
            case 'activitylog':
                return <ActivityLog onSelectClient={setSelectedClientId} />;
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

    const NotificationsDropdown = () => {
        const fetchNotifications = async () => {
            if (hasFetchedNotifications.current || loadingNotifications) return;
            hasFetchedNotifications.current = true;
            setLoadingNotifications(true);
            try {
                const data = await notificationService.getAll();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
                hasFetchedNotifications.current = false; // Allow retry on error
            } finally {
                setLoadingNotifications(false);
            }
        };

        // Fetch only once when dropdown opens
        if (isNotificationsOpen && !hasFetchedNotifications.current) {
            fetchNotifications();
        }

        const handleMarkAllRead = async () => {
            try {
                await notificationService.markAllAsRead();
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            } catch (error) {
                console.error('Failed to mark all as read:', error);
            }
        };

        const handleNotificationClick = async (notification: Notification) => {
            // Mark as read if unread
            if (!notification.isRead) {
                try {
                    await notificationService.markAsRead(notification.id);
                    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                    setUnreadCount(prev => Math.max(0, prev - 1));
                } catch (error) {
                    console.error('Failed to mark as read:', error);
                }
            }

            // Navigate to destination if link exists
            if (notification.link) {
                setIsNotificationsOpen(false);

                // Parse link to determine navigation
                // Links format: /clients/{id}, /tasks, /calendar, etc.
                if (notification.link.startsWith('/clients/')) {
                    const clientId = notification.link.replace('/clients/', '');
                    setSelectedClientId(clientId);
                } else if (notification.link === '/tasks') {
                    setCurrentView('tasks');
                } else if (notification.link === '/calendar') {
                    setCurrentView('calendar');
                } else if (notification.link === '/leads') {
                    setCurrentView('leads');
                } else {
                    // Default: try to extract view name from link
                    const viewName = notification.link.replace('/', '');
                    if (['dashboard', 'pipeline', 'tasks', 'workshops', 'leads', 'clients', 'calendar', 'documents', 'reports', 'communications', 'settings', 'team', 'activitylog'].includes(viewName)) {
                        setCurrentView(viewName);
                    }
                }
            }
        };

        const getNotificationIcon = (type: string) => {
            switch (type) {
                case 'new_lead': return <AlertCircle size={16} className="text-blue-500" />;
                case 'appointment': return <Calendar size={16} className="text-teal-500" />;
                default: return <Bell size={16} className="text-slate-400" />;
            }
        };

        const formatTime = (dateStr: string) => {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            return date.toLocaleDateString();
        };

        return (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-navy-900">Notifications</h3>
                    {notifications.length > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-teal-600 hover:underline">Mark all read</button>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {loadingNotifications ? (
                        <div className="p-8 text-center text-slate-400">
                            <div className="animate-spin mx-auto w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-sm">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-teal-50/30' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-navy-900' : 'text-slate-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">{notification.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">{formatTime(notification.createdAt)}</p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-teal-500 mt-2"></div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <button
                        onClick={() => {
                            setIsNotificationsOpen(false);
                            setCurrentView('activitylog');
                        }}
                        className="text-xs font-medium text-slate-500 hover:text-navy-900"
                    >
                        View All Activity
                    </button>
                </div>
            </div>
        );
    };

    const QuickAddForm = () => {
        const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
        const [formData, setFormData] = useState({
            // Client fields
            name: '',
            email: '',
            phone: '',
            clientStatus: 'Lead',
            // Task fields
            title: '',
            due: '',
            priority: 'Medium',
            taskType: 'Follow-up',
            taskClientId: '',
            // Event/Workshop fields
            date: '',
            time: '',
            location: '',
            capacity: '',
            // Appointment fields
            apptType: 'Meeting',
            clientId: '',
            advisorId: ''
        });

        const handleSubmit = async () => {
            setStatus('saving');
            try {
                if (quickAddType === 'client') {
                    await clientService.create({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        status: formData.clientStatus as 'Active' | 'Lead' | 'Prospect'
                    });
                } else if (quickAddType === 'task') {
                    await taskService.create({
                        title: formData.title,
                        due: formData.due ? new Date(formData.due).toISOString() : undefined,
                        priority: formData.priority as 'High' | 'Medium' | 'Low',
                        type: formData.taskType as 'Follow-up' | 'Call' | 'Prep',
                        clientId: formData.taskClientId || undefined
                    });
                } else if (quickAddType === 'event') {
                    const startDate = new Date(`${formData.date}T${formData.time || '09:00'}`);
                    const endDate = new Date(startDate.getTime() + 3600000);
                    await eventService.create({
                        title: formData.title,
                        start: startDate,
                        end: endDate,
                        type: 'Workshop',
                        location: formData.location || undefined,
                        capacity: formData.capacity ? parseInt(formData.capacity) : undefined
                    });
                } else if (quickAddType === 'appointment') {
                    const startDate = new Date(`${formData.date}T${formData.time || '09:00'}`);
                    const endDate = new Date(startDate.getTime() + 3600000);
                    await eventService.create({
                        title: formData.title,
                        start: startDate,
                        end: endDate,
                        type: formData.apptType,
                        clientId: formData.clientId || undefined,
                        advisorId: formData.advisorId || undefined
                    });
                }
                setStatus('success');
                setTimeout(() => {
                    setQuickAddOpen(false);
                    setStatus('idle');
                    setFormData({
                        name: '', email: '', phone: '', clientStatus: 'Lead',
                        title: '', due: '', priority: 'Medium', taskType: 'Follow-up', taskClientId: '',
                        date: '', time: '', location: '', capacity: '',
                        apptType: 'Meeting', clientId: '', advisorId: ''
                    });
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
                <div className="grid grid-cols-4 bg-slate-100 p-1 rounded-lg mb-6 gap-1">
                    {(['client', 'task', 'event', 'appointment'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setQuickAddType(type)}
                            className={`text-xs sm:text-sm font-medium py-1.5 rounded-md capitalize ${quickAddType === type ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-800'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {quickAddType === 'client' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Full Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Jonathan Doe"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="email@example.com"
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Status</label>
                            <select
                                value={formData.clientStatus}
                                onChange={(e) => setFormData({ ...formData, clientStatus: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="Active">Active (Client)</option>
                                <option value="Lead">Lead</option>
                                <option value="Prospect">Prospect</option>
                            </select>
                        </div>
                    </>
                )}

                {quickAddType === 'task' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Task Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Follow up on retirement plan"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={formData.due}
                                    onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Type</label>
                                <select
                                    value={formData.taskType}
                                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Call">Call</option>
                                    <option value="Prep">Prep</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Client</label>
                                <select
                                    value={formData.taskClientId}
                                    onChange={(e) => setFormData({ ...formData, taskClientId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">Select Client...</option>
                                    {quickAddClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </>
                )}

                {quickAddType === 'event' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Workshop Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Retirement Planning 101"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Date *</label>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g. Main Office"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Capacity</label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g. 25"
                                />
                            </div>
                        </div>
                    </>
                )}

                {quickAddType === 'appointment' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Appointment Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                placeholder="e.g. Portfolio Review"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Date *</label>
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
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Type</label>
                            <select
                                value={formData.apptType}
                                onChange={(e) => setFormData({ ...formData, apptType: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="Meeting">Meeting</option>
                                <option value="Call">Call</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Client *</label>
                                <select
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">Select Client...</option>
                                    {quickAddClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-navy-900 mb-1">Advisor</label>
                                <select
                                    value={formData.advisorId}
                                    onChange={(e) => setFormData({ ...formData, advisorId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="">Select Advisor...</option>
                                    {quickAddAdvisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
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
                    <div className="flex items-center w-96 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all group shadow-sm relative">
                        <Search size={18} className="text-slate-400 mr-3 group-focus-within:text-teal-600" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search clients, documents, or events..."
                            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400 text-navy-900"
                        />
                        {/* Search Results Dropdown */}
                        {searchQuery.length >= 2 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto">
                                {isSearching ? (
                                    <div className="p-4 text-center text-slate-400">
                                        <div className="animate-spin mx-auto w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                                    </div>
                                ) : (searchResults.clients.length === 0 && searchResults.events.length === 0 && searchResults.workshops.length === 0) ? (
                                    <div className="p-4 text-center text-slate-400 text-sm">No results found</div>
                                ) : (
                                    <>
                                        {/* Clients Section */}
                                        {searchResults.clients.length > 0 && (
                                            <>
                                                <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</div>
                                                {searchResults.clients.map(client => (
                                                    <button
                                                        key={client.id}
                                                        onClick={() => {
                                                            setSelectedClientId(client.id);
                                                            setSearchQuery('');
                                                            setSearchResults({ clients: [], events: [], workshops: [] });
                                                        }}
                                                        className="w-full p-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-semibold text-sm">
                                                            {client.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-navy-900">{client.name}</p>
                                                            <p className="text-xs text-slate-500">{client.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        )}

                                        {/* Events Section */}
                                        {searchResults.events.length > 0 && (
                                            <>
                                                <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">Events</div>
                                                {searchResults.events.map((event: any) => (
                                                    <button
                                                        key={event.id}
                                                        onClick={() => {
                                                            setCurrentView('calendar');
                                                            setSearchQuery('');
                                                            setSearchResults({ clients: [], events: [], workshops: [] });
                                                        }}
                                                        className="w-full p-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                            <Calendar size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-navy-900">{event.title}</p>
                                                            <p className="text-xs text-slate-500">{event.type} • {event.clientName || 'No client'}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        )}

                                        {/* Workshops Section */}
                                        {searchResults.workshops.length > 0 && (
                                            <>
                                                <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">Workshops</div>
                                                {searchResults.workshops.map((workshop: any) => (
                                                    <button
                                                        key={workshop.id}
                                                        onClick={() => {
                                                            setCurrentView('workshops');
                                                            setSearchQuery('');
                                                            setSearchResults({ clients: [], events: [], workshops: [] });
                                                        }}
                                                        className="w-full p-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                            <Calendar size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-navy-900">{workshop.title}</p>
                                                            <p className="text-xs text-slate-500">{workshop.location || 'No location'}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className={`relative text-slate-400 hover:text-navy-900 transition-colors p-2.5 rounded-full hover:bg-slate-50 ${isNotificationsOpen ? 'bg-slate-100 text-navy-900' : ''}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
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

            <ImportWizard
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onComplete={() => {
                    // Refresh client list when import completes
                    if (currentView === 'clients') {
                        setCurrentView('dashboard');
                        setTimeout(() => setCurrentView('clients'), 100);
                    }
                }}
            />
        </div>
    );
};

export default DashboardLayout;
