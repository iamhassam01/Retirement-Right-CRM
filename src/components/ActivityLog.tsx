import React, { useState, useEffect } from 'react';
import { Activity, Clock, Users, Calendar, FileText, Phone, Mail, CheckCircle } from 'lucide-react';
import { activityService } from '../services/activity.service';
import { eventService } from '../services/event.service';
import { clientService } from '../services/client.service';
import { taskService } from '../services/task.service';

interface ActivityItem {
    id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'client_added' | 'appointment' | 'event';
    title: string;
    description: string;
    timestamp: string;
    clientName?: string;
    clientId?: string;
}

interface ActivityLogProps {
    onSelectClient?: (clientId: string) => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ onSelectClient }) => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAllActivities();
    }, []);

    const fetchAllActivities = async () => {
        setIsLoading(true);
        try {
            // Fetch from multiple sources and combine
            const [activitiesData, eventsData, clientsData, tasksData] = await Promise.all([
                activityService.getAll().catch(() => []),
                eventService.getAll().catch(() => []),
                clientService.getAll().catch(() => []),
                taskService.getAll().catch(() => [])
            ]);

            const combinedActivities: ActivityItem[] = [];

            // Add activities from activity log
            activitiesData.forEach((activity: any) => {
                combinedActivities.push({
                    id: `activity-${activity.id}`,
                    type: activity.type || 'note',
                    title: activity.type === 'call' ? 'Call Logged' :
                        activity.type === 'email' ? 'Email Sent' :
                            activity.type === 'meeting' ? 'Meeting' : 'Activity',
                    description: activity.notes || activity.type,
                    timestamp: activity.date || new Date().toISOString(),
                    clientName: activity.client?.name,
                    clientId: activity.clientId
                });
            });

            // Add recent events/appointments
            eventsData.slice(0, 10).forEach((event: any) => {
                // Use createdAt (when event was created) not start (when it's scheduled)
                const createdTimestamp = event.createdAt
                    ? (event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt)
                    : new Date().toISOString();
                combinedActivities.push({
                    id: `event-${event.id}`,
                    type: 'appointment',
                    title: event.title || 'Appointment',
                    description: `${event.type || 'Event'} scheduled`,
                    timestamp: createdTimestamp,
                    clientName: event.clientName,
                    clientId: event.clientId
                });
            });

            // Add recent clients
            clientsData.slice(0, 5).forEach((client: any) => {
                combinedActivities.push({
                    id: `client-${client.id}`,
                    type: 'client_added',
                    title: 'Client Added',
                    description: `${client.name} added to ${client.pipelineStage || 'pipeline'}`,
                    timestamp: client.createdAt || new Date().toISOString(),
                    clientName: client.name,
                    clientId: client.id
                });
            });

            // Add recent tasks
            tasksData.slice(0, 5).forEach((task: any) => {
                combinedActivities.push({
                    id: `task-${task.id}`,
                    type: 'task',
                    title: task.status === 'Completed' ? 'Task Completed' : 'Task Created',
                    description: task.title,
                    timestamp: task.createdAt || task.due || new Date().toISOString(),
                    clientName: task.clientName,
                    clientId: task.clientId
                });
            });

            // Sort by timestamp descending
            combinedActivities.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            setActivities(combinedActivities);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
        try {
            if (!dateStr) return 'Unknown';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateStr);
                return 'Unknown';
            }
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();

            // Handle future dates
            if (diffMs < 0) return 'Scheduled';

            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (err) {
            console.error('formatTime error:', err);
            return 'Unknown';
        }
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
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-navy-900">Activity Log</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">Track all activities across your CRM</p>
                </div>
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-500">
                        {activities.length} activities loaded
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-6">
                <div className="flex gap-2 flex-wrap overflow-x-auto -mx-1 px-1 scrollbar-hide">
                    {filterOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${filter === option.value
                                ? 'bg-teal-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
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
                            <div key={activity.id}
                                onClick={() => activity.clientId && onSelectClient?.(activity.clientId)}
                                className={`p-5 hover:bg-slate-50 transition-colors ${activity.clientId && onSelectClient ? 'cursor-pointer' : ''}`}
                            >
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
                                            <p className={`text-xs mt-1 ${activity.clientId && onSelectClient ? 'text-teal-600 hover:underline' : 'text-teal-600'}`}>Client: {activity.clientName}</p>
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
