import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, RefreshCw, Bot, ChevronUp, ChevronDown, List, Trash2, Edit3, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { getCalendarEvents, createEvent } from '../services/db';
import { teamService } from '../services/team.service';
import { eventService } from '../services/event.service';
import { clientService } from '../services/client.service';
import { CalendarEvent, Client } from '../types';
import Modal from './Modal';

type CalendarViewType = 'month' | 'week' | 'day';

const CalendarView: React.FC = () => {
  const [view, setView] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedDate, setExpandedDate] = useState<number | null>(null);
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<CalendarEvent | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [advisors, setAdvisors] = useState<{ id: string, name: string }[]>([]);

  // Fetch real data on mount and when date/view changes
  useEffect(() => {
    fetchEvents();
    fetchAvailability();
    fetchClientsAndAdvisors();
  }, [currentDate, view]);

  const fetchClientsAndAdvisors = async () => {
    try {
      const [clientsData, advisorsData] = await Promise.all([
        clientService.getAll(),
        teamService.getAll()
      ]);
      setClients(clientsData);
      setAdvisors(advisorsData.map((a: any) => ({ id: a.id, name: a.name })));
    } catch (error) {
      console.error('Failed to fetch clients/advisors:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const data = await teamService.getMyAvailability();
      setIsAvailable(data.isAvailable);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Determine range based on view
      let start = new Date(currentDate);
      let end = new Date(currentDate);

      if (view === 'month') {
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      } else if (view === 'week') {
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        start = new Date(currentDate);
        start.setDate(currentDate.getDate() - day); // Sunday start
        end = new Date(start);
        end.setDate(start.getDate() + 6);
      } else {
        start = new Date(currentDate.setHours(0, 0, 0, 0));
        end = new Date(currentDate.setHours(23, 59, 59, 999));
      }

      // Add buffer for week/day views to catch crossing events
      if (view !== 'month') {
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() + 1);
      }

      const data = await getCalendarEvents(start, end);
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }; const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const dateStr = formData.get('date') as string;
      const timeStr = formData.get('time') as string;
      const type = formData.get('type') as any || 'Meeting';
      const clientId = formData.get('clientId') as string || undefined;
      const advisorId = formData.get('advisorId') as string || undefined;

      const start = new Date(`${dateStr}T${timeStr}`);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      if (editingEvent) {
        await eventService.update(editingEvent.id, {
          title, start, end, type, clientId: clientId || undefined, advisorId: advisorId || undefined
        });
        setEditingEvent(null);
      } else {
        await createEvent({
          title, start, end, type, clientId: clientId || undefined, advisorId: advisorId || undefined
        });
      }

      setIsModalOpen(false);
      await fetchEvents();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save appointment. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(e =>
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    );
  };

  // --- Renderers ---

  const renderMonthView = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDay = startOfMonth.getDay();
    const dates = Array.from({ length: 42 }, (_, i) => { // Fixed 6 rows for consistency
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), i - startDay + 1);
    });

    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-y-auto">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {days.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 relative auto-rows-fr">
          {dates.map((date, idx) => {
            const isToday = new Date().toDateString() === date.toDateString();
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const dayEvents = getEventsForDate(date);
            return (
              <div key={idx} className={`border-b border-r border-slate-100 p-2 min-h-[100px] relative hover:bg-slate-50/50 transition-colors ${idx % 7 === 6 ? 'border-r-0' : ''} ${!isCurrentMonth ? 'bg-slate-50/30' : ''}`}>
                <div className={`text-sm font-medium mb-2 ${isToday ? 'w-7 h-7 bg-teal-600 text-white flex items-center justify-center rounded-full' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div key={event.id}
                      onClick={() => { setEditingEvent(event); setIsModalOpen(true); }}
                      className={`p-1.5 rounded border text-xs cursor-pointer truncate ${event.type === 'Meeting' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : event.type === 'Call' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-teal-50 border-teal-100 text-teal-700'}`}>
                      <span className="font-semibold mr-1">{event.start.getHours()}:{event.start.getMinutes().toString().padStart(2, '0')}</span>
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM

    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50">
          <div className="p-3 border-r border-slate-200"></div> {/* Time col */}
          {weekDates.map(date => {
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <div key={date.toString()} className={`py-3 text-center border-r border-slate-200 last:border-r-0`}>
                <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isToday ? 'text-teal-600' : 'text-slate-500'}`}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={`text-lg font-bold ${isToday ? 'w-8 h-8 bg-teal-600 text-white flex items-center justify-center rounded-full mx-auto' : 'text-navy-900'}`}>{date.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-8 relative" style={{ minHeight: '800px' }}>
            {/* Time Labels */}
            <div className="col-span-1 border-r border-slate-200">
              {hours.map(hour => (
                <div key={hour} className="h-20 border-b border-slate-100 relative">
                  <span className="absolute -top-3 right-2 text-xs text-slate-400 bg-white px-1">
                    {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                  </span>
                </div>
              ))}
            </div>

            {/* Days */}
            {weekDates.map((date, dayIdx) => {
              const dayEvents = getEventsForDate(date);
              return (
                <div key={dayIdx} className="col-span-1 border-r border-slate-200 last:border-r-0 relative bg-white">
                  {hours.map(hour => (
                    <div key={hour} className="h-20 border-b border-slate-100"></div>
                  ))}
                  {/* Events Overlay */}
                  {dayEvents.map(event => {
                    const startHour = event.start.getHours();
                    const startMin = event.start.getMinutes();
                    const durationMin = (event.end.getTime() - event.start.getTime()) / (1000 * 60);

                    // Calculate position 
                    // 6 AM is top (0). Each hour is 80px (h-20).
                    // offset = (hour - 6) * 80 + (min/60)*80
                    const top = Math.max(0, (startHour - 6) * 80 + (startMin / 60) * 80);
                    const height = Math.max(30, (durationMin / 60) * 80); // Min height to view

                    if (startHour < 6) return null; // Don't show early events for now

                    return (
                      <div key={event.id}
                        onClick={() => { setEditingEvent(event); setIsModalOpen(true); }}
                        className={`absolute left-1 right-1 rounded border overflow-hidden cursor-pointer shadow-sm text-xs z-10 px-2 py-1 opacity-90 transition-opacity hover:opacity-100 hover:z-20
                               ${event.type === 'Meeting' ? 'bg-indigo-100 border-indigo-200 text-indigo-800' :
                            event.type === 'Call' ? 'bg-amber-100 border-amber-200 text-amber-800' :
                              'bg-teal-100 border-teal-200 text-teal-800'}`}
                        style={{ top: `${top}px`, height: `${height}px` }}>
                        <div className="font-semibold">{event.title}</div>
                        <div>{event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM
    const dayEvents = getEventsForDate(currentDate);
    const isToday = new Date().toDateString() === currentDate.toDateString();

    return (
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-50 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-navy-900">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            {isToday && <span className="text-sm font-medium text-teal-600">Today</span>}
          </div>
        </div>
        {/* Grid */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="w-full relative" style={{ minHeight: '800px' }}>
            {hours.map(hour => (
              <div key={hour} className="flex border-b border-slate-100 h-24">
                <div className="w-20 border-r border-slate-200 p-2 text-right">
                  <span className="text-sm text-slate-500 font-medium">{hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}</span>
                </div>
                <div className="flex-1 bg-white"></div>
              </div>
            ))}
            {/* Events logic mostly same as Week */}
            {dayEvents.map(event => {
              const startHour = event.start.getHours();
              const startMin = event.start.getMinutes();
              const durationMin = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
              const top = Math.max(0, (startHour - 6) * 96 + (startMin / 60) * 96); // h-24 is 96px
              const height = Math.max(40, (durationMin / 60) * 96);

              if (startHour < 6) return null;

              return (
                <div key={event.id}
                  onClick={() => { setEditingEvent(event); setIsModalOpen(true); }}
                  className={`absolute left-24 right-4 rounded-lg border-l-4 shadow-sm p-3 cursor-pointer transition-transform hover:scale-[1.01]
                           ${event.type === 'Meeting' ? 'bg-indigo-50 border-indigo-500 text-indigo-900' :
                      event.type === 'Call' ? 'bg-amber-50 border-amber-500 text-amber-900' :
                        'bg-teal-50 border-teal-500 text-teal-900'}`}
                  style={{ top: `${top}px`, height: `${height}px` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base">{event.title}</h4>
                      <p className="text-sm opacity-80">{event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {event.clientName && <p className="text-sm mt-1">{event.clientName}</p>}
                    </div>
                    <div className="bg-white/50 px-2 py-1 rounded text-xs font-semibold uppercase">{event.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in gap-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Advisor Schedule</h2>
            <p className="text-slate-500 text-sm">Manage your time and availability</p>
          </div>

          {/* View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setView('month')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'month' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}>Month</button>
            <button onClick={() => setView('week')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'week' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}>Week</button>
            <button onClick={() => setView('day')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'day' ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}>Day</button>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Availability Switch */}
          <div
            onClick={async () => {
              if (isToggling) return;
              const newStatus = !isAvailable;
              setIsToggling(true);
              try {
                const res = await teamService.setAvailability(newStatus);
                if (res.success) setIsAvailable(newStatus);
              } finally {
                setIsToggling(false);
              }
            }}
            className={`group flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full border cursor-pointer select-none transition-all duration-300 ${isAvailable ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
          >
            <div className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAvailable ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wide ${isAvailable ? 'text-emerald-700' : 'text-slate-500'}`}>{isAvailable ? 'Online' : 'Offline'}</span>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          {/* Navigation */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button onClick={() => navigateDate('prev')} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={20} /></button>
            <span className="px-3 text-sm font-semibold text-navy-900 min-w-[120px] text-center">
              {view === 'month' ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : view === 'week' ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </span>
            <button onClick={() => navigateDate('next')} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={20} /></button>
          </div>


          <button
            onClick={async () => {
              setIsAppointmentsModalOpen(true);
              setIsLoadingUpcoming(true);
              try {
                const upcoming = await eventService.getUpcoming();
                setUpcomingEvents(upcoming);
              } catch (error) {
                console.error('Failed to fetch upcoming appointments:', error);
              } finally {
                setIsLoadingUpcoming(false);
              }
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-teal-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <List size={16} /> View Appointments
          </button>

          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-navy-800 transition-all active:scale-95">
            + New Appointment
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
            <RefreshCw className="animate-spin text-teal-600" />
          </div>
        )}
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingEvent(null); }} title={editingEvent ? 'Edit Appointment' : 'New Appointment'}>
        <form key={editingEvent ? editingEvent.id : 'new'} onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Appointment Title</label>
            <input name="title" type="text" defaultValue={editingEvent?.title || ''} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Portfolio Review" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
              <input name="date" type="date" defaultValue={editingEvent ? new Date(editingEvent.start).toISOString().split('T')[0] : ''} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
              <input name="time" type="time" defaultValue={editingEvent ? `${new Date(editingEvent.start).getHours().toString().padStart(2, '0')}:${new Date(editingEvent.start).getMinutes().toString().padStart(2, '0')}` : ''} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Type</label>
            <select name="type" defaultValue={editingEvent?.type || 'Meeting'} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Client</label>
              <select name="clientId" defaultValue={editingEvent?.clientId || ''} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Advisor</label>
              <select name="advisorId" defaultValue={editingEvent?.advisorId || ''} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select Advisor...</option>
                {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingEvent(null); }} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors" disabled={isCreating}>Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50" disabled={isCreating}>
              {isCreating ? (editingEvent ? 'Saving...' : 'Scheduling...') : (editingEvent ? 'Save Changes' : 'Schedule')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Appointments Modal */}
      <Modal isOpen={isAppointmentsModalOpen} onClose={() => { setIsAppointmentsModalOpen(false); }} title="Upcoming Appointments">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoadingUpcoming ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-teal-600" size={24} />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No upcoming appointments</p>
            </div>
          ) : (
            upcomingEvents.map(event => (
              <div key={event.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-navy-900">{event.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {event.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  {event.clientName && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span className="font-medium">Client:</span> {event.clientName}
                    </p>
                  )}
                  {event.advisorName && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="font-medium">Advisor:</span> {event.advisorName}
                    </p>
                  )}
                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${event.type === 'Meeting' ? 'bg-indigo-100 text-indigo-700' : event.type === 'Call' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                    {event.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setEditingEvent(event);
                      setIsAppointmentsModalOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                    title="Edit Appointment"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDeleteConfirmEvent(event);
                    }}
                    disabled={isDeleting === event.id}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Delete Appointment"
                  >
                    {isDeleting === event.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmEvent !== null}
        onClose={() => setDeleteConfirmEvent(null)}
        title="Delete Appointment"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to delete <span className="font-semibold text-navy-900">"{deleteConfirmEvent?.title}"</span>?
          </p>
          <p className="text-sm text-slate-500">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDeleteConfirmEvent(null)}
              className="flex-1 py-2.5 px-4 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              disabled={isDeleting !== null}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!deleteConfirmEvent) return;
                setIsDeleting(deleteConfirmEvent.id);
                eventService.delete(deleteConfirmEvent.id)
                  .then(() => {
                    setUpcomingEvents(prev => prev.filter(ev => ev.id !== deleteConfirmEvent.id));
                    fetchEvents();
                    setDeleteConfirmEvent(null);
                  })
                  .catch((error) => {
                    console.error('Delete failed:', error);
                    alert('Failed to delete appointment. Please try again.');
                  })
                  .finally(() => {
                    setIsDeleting(null);
                  });
              }}
              disabled={isDeleting !== null}
              className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CalendarView;
