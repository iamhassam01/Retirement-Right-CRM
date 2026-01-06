import React, { useState, useEffect } from 'react';
import { Activity, Clock, Users, Calendar, MessageSquare, FileText, Phone, Mail, CheckCircle } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'client_added' | 'appointment';
    title: string;
    description: string;
    user: string;
    timestamp: string;
    clientName?: string;
}

// Mock data - in production, this would come from an API
const mockActivities: ActivityItem[] = [
    {
        id: '1',
        type: 'client_added',
        title: 'New Lead Added',
        description: 'James Wilson added to pipeline',
        user: 'System',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        clientName: 'James Wilson'
    },
    {
        id: '2',
        type: 'appointment',
        title: 'Appointment Scheduled',
        description: 'Portfolio Review with Sarah Johnson',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        clientName: 'Sarah Johnson'
    },
    {
        id: '3',
        type: 'call',
        title: 'Call Completed',
        description: 'Follow-up call with Michael Chen - 15 mins',
        user: 'Michael Chen',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        clientName: 'Michael Chen'
    },
    {
        id: '4',
        type: 'email',
        title: 'Email Sent',
        description: 'Retirement planning documents sent',
        user: 'System',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        clientName: 'Robert Davis'
    },
    {
        id: '5',
        type: 'task',
        title: 'Task Completed',
        description: 'Quarterly review preparation completed',
        user: 'Admin',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    }
];

const ActivityLog: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        setTimeout(() => {
            setActivities(mockActivities);
            setIsLoading(false);
        }, 500);
    }, []);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone size={16} className="text-blue-500" />;
            case 'email': return <Mail size={16} className="text-purple-500" />;
            case 'meeting': return <Calendar size={16} className="text-green-500" />;
            case 'appointment': return <Calendar size={16} className="text-teal-500" />;
            case 'note': return <FileText size={16} className="text-orange-500" />;
            case 'task': return <CheckCircle size={16} className="text-emerald-500" />;
            case 'client_added': return <Users size={16} className="text-indigo-500" />;
            default: return <Activity size={16} className="text-slate-400" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    const filterOptions = [
        { value: 'all', label: 'All Activity' },
        { value: 'call', label: 'Calls' },
        { value: 'email', label: 'Emails' },
        { value: 'appointment', label: 'Appointments' },
        { value: 'task', label: 'Tasks' },
        { value: 'client_added', label: 'New Clients' }
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-navy-900">Activity Log</h1>
                    <p className="text-slate-500 mt-1">Track all activities across your CRM</p>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-500">Last updated: Just now</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                    {filterOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === option.value
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin mx-auto w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"></div>
                        <p className="text-slate-500 mt-4">Loading activities...</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Activity size={48} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium text-slate-600">No activities found</p>
                        <p className="text-sm">Activities will appear here as you use the CRM</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredActivities.map(activity => (
                            <div key={activity.id} className="p-5 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-navy-900">{activity.title}</p>
                                            <span className="text-xs text-slate-400">{formatTime(activity.timestamp)}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
                                        {activity.clientName && (
                                            <p className="text-xs text-teal-600 mt-1">Client: {activity.clientName}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;
