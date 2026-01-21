import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { clientService } from '../services/client.service';
import { taskService } from '../services/task.service';
import { eventService } from '../services/event.service';
import { noteService } from '../services/note.service';
import { Client } from '../types';
import { useResponsiveView } from '../hooks/useMediaQuery';

interface QuickAddFormProps {
    quickAddType: 'client' | 'task' | 'event' | 'appointment' | 'policy';
    setQuickAddType: (type: 'client' | 'task' | 'event' | 'appointment' | 'policy') => void;
    quickAddClients: Client[];
    quickAddAdvisors: { id: string, name: string }[];
    onClose: () => void;
}

const QuickAddForm: React.FC<QuickAddFormProps> = ({
    quickAddType,
    setQuickAddType,
    quickAddClients,
    quickAddAdvisors,
    onClose
}) => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const { isMobile } = useResponsiveView();
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
        advisorId: '',
        // Policy Delivery fields
        policyTitle: '',
        policyNotes: '',
        policyClientSearch: ''
    });

    const resetFormData = () => {
        setFormData({
            name: '', email: '', phone: '', clientStatus: 'Lead',
            title: '', due: '', priority: 'Medium', taskType: 'Follow-up', taskClientId: '',
            date: '', time: '', location: '', capacity: '',
            apptType: 'Meeting', clientId: '', advisorId: '',
            policyTitle: '', policyNotes: '', policyClientSearch: ''
        });
    };

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
            } else if (quickAddType === 'policy') {
                const startDate = new Date(`${formData.date}T${formData.time || '09:00'}`);

                // Create a task/reminder for Policy Delivery (appears in Todos/Reminders page and Calendar)
                const clientName = quickAddClients.find(c => c.id === formData.clientId)?.name || '';
                await taskService.create({
                    title: `Policy Delivery: ${formData.policyTitle || 'Policy Review'}`,
                    due: startDate.toISOString(),
                    priority: 'High' as 'High' | 'Medium' | 'Low',
                    type: 'Policy Delivery',
                    clientId: formData.clientId || undefined,
                    description: formData.policyNotes || `Scheduled policy delivery for ${clientName}`
                });

                // Add notes to client Notes section if notes provided
                if (formData.clientId && formData.policyNotes) {
                    try {
                        await noteService.create({
                            clientId: formData.clientId,
                            title: `Policy Delivery - ${formData.policyTitle || 'Policy Review'}`,
                            content: formData.policyNotes,
                            category: 'Policy'
                        });
                    } catch (noteError) {
                        console.error('Failed to create note:', noteError);
                        // Continue - main creation was successful
                    }
                }
            }
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                resetFormData();
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
            {/* Type Tabs - Scrollable on mobile */}
            <div className="flex overflow-x-auto sm:grid sm:grid-cols-5 bg-slate-100 p-1 rounded-lg mb-6 gap-1 -mx-1 px-1 scrollbar-hide">
                {(['client', 'task', 'event', 'appointment', 'policy'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => setQuickAddType(type)}
                        className={`flex-shrink-0 px-3 sm:px-2 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-md text-sm font-medium capitalize transition-colors ${quickAddType === type ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-800 active:bg-white/50'
                            }`}
                    >
                        {type === 'policy' ? 'Policy' : type}
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
                            className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                            placeholder="e.g. Jonathan Doe"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                                placeholder="email@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1">Status</label>
                        <select
                            value={formData.clientStatus}
                            onChange={(e) => setFormData({ ...formData, clientStatus: e.target.value })}
                            className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
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
                            className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                            placeholder="e.g. Follow up on retirement plan"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={formData.due}
                                onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                                className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
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

            {quickAddType === 'policy' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1">Policy Delivery Title *</label>
                        <input
                            type="text"
                            value={formData.policyTitle}
                            onChange={(e) => setFormData({ ...formData, policyTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. Annual Policy Review, Life Insurance Delivery"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Date *</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-navy-900 mb-1">Time *</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1">Client *</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.policyClientSearch}
                                onChange={(e) => setFormData({ ...formData, policyClientSearch: e.target.value, clientId: '' })}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Type to search clients..."
                            />
                            {formData.policyClientSearch && !formData.clientId && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {quickAddClients
                                        .filter(c => c.name.toLowerCase().includes(formData.policyClientSearch.toLowerCase()))
                                        .slice(0, 8)
                                        .map(client => (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, clientId: client.id, policyClientSearch: client.name })}
                                                className="w-full px-3 py-2 text-left hover:bg-purple-50 text-sm text-navy-900"
                                            >
                                                {client.name}
                                                {client.email && <span className="text-slate-400 ml-2 text-xs">{client.email}</span>}
                                            </button>
                                        ))}
                                    {quickAddClients.filter(c => c.name.toLowerCase().includes(formData.policyClientSearch.toLowerCase())).length === 0 && (
                                        <div className="px-3 py-2 text-sm text-slate-400">No clients found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1">Assigned Advisor</label>
                        <select
                            value={formData.advisorId}
                            onChange={(e) => setFormData({ ...formData, advisorId: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Select Advisor...</option>
                            {quickAddAdvisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-900 mb-1">Notes</label>
                        <textarea
                            value={formData.policyNotes}
                            onChange={(e) => setFormData({ ...formData, policyNotes: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 resize-none"
                            placeholder="Policy details, documents needed, etc."
                        />
                    </div>
                </>
            )}

            <div className="pt-4 pb-safe">
                <button
                    onClick={handleSubmit}
                    disabled={status === 'saving'}
                    className="w-full bg-navy-900 hover:bg-navy-800 active:bg-navy-700 text-white font-medium py-3 min-h-[48px] rounded-lg transition-colors flex items-center justify-center gap-2 text-base"
                >
                    {status === 'saving' ? 'Creating...' : `Create ${quickAddType}`}
                </button>
            </div>
        </div>
    );
};

export default QuickAddForm;
