import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, RefreshCw, Bot, ChevronUp, ChevronDown, List, Trash2, Edit3, Loader2 } from 'lucide-react';
import { getCalendarEvents, createEvent } from '../services/db';
import { teamService } from '../services/team.service';
import { eventService } from '../services/event.service';
import { CalendarEvent } from '../types';
import Modal from './Modal';

const CalendarView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState<number | null>(null);
  const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch real data on mount
  useEffect(() => {
    fetchEvents();
    fetchAvailability();
  }, [currentMonth]);

  // Fetch availability status from backend
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
      // Fetch a wide range for the month
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const data = await getCalendarEvents(start, end);
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const dateStr = formData.get('date') as string;
      const timeStr = formData.get('time') as string;
      const type = formData.get('type') as any || 'Meeting';

      const start = new Date(`${dateStr}T${timeStr}`);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour duration

      await createEvent({
        title,
        start,
        end,
        type
      });

      setIsModalOpen(false);
      await fetchEvents(); // Refresh after create
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create appointment. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDay = startOfMonth.getDay();
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - startDay + 1);
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(e =>
      e.start.getDate() === date.getDate() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getFullYear() === date.getFullYear()
    );
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Advisor Schedule</h2>
          <p className="text-slate-500 text-sm">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
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
                if (res.success) {
                  setIsAvailable(newStatus);
                }
              } catch (error) {
                console.error('Failed to update availability:', error);
              } finally {
                setIsToggling(false);
              }
            }}
            className={`
                group flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full border cursor-pointer select-none transition-all duration-300
                ${isAvailable
                ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'}
              `}
            title="Toggle Advisor Availability"
          >
            <div className={`
                w-10 h-6 rounded-full relative transition-colors duration-300 ease-in-out
                ${isAvailable ? 'bg-emerald-500 shadow-inner' : 'bg-slate-300 shadow-inner'}
              `}>
              <div className={`
                  absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md 
                  transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  flex items-center justify-center
                  ${isAvailable ? 'translate-x-4' : 'translate-x-0'}
                `}>
                {isToggling ? (
                  <RefreshCw size={10} className="animate-spin text-slate-400" />
                ) : isAvailable ? (
                  <Check size={10} strokeWidth={3} className="text-emerald-500" />
                ) : (
                  <X size={10} strokeWidth={3} className="text-slate-400" />
                )}
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className={`text-xs font-bold uppercase tracking-wide transition-colors ${isAvailable ? 'text-emerald-700' : 'text-slate-500'}`}>
                Availability
              </span>
              <span className={`text-[10px] font-medium transition-colors ${isAvailable ? 'text-emerald-600/80' : 'text-slate-400'}`}>
                {isAvailable ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={20} /></button>
            <button onClick={() => fetchEvents()} className="p-1 hover:bg-slate-100 rounded text-slate-500"><RefreshCw size={16} /></button>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={20} /></button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-navy-800 transition-all active:scale-95"
          >
            + New Appointment
          </button>
        </div>
      </div>

      <div className={`flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-opacity duration-300 ${isAvailable ? 'opacity-100' : 'opacity-95'}`}>
        <div className="grid grid-cols-7 border-b border-slate-200">
          {days.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-5 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
              <RefreshCw className="animate-spin text-teal-600" />
            </div>
          )}

          {!isAvailable && (
            <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 px-6 py-3 rounded-full shadow-lg border border-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-sm font-medium text-slate-600">Calendar synced with Vapi (Offline Mode)</span>
              </div>
            </div>
          )}

          {dates.map((date, idx) => {
            const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const dayEvents = getEventsForDate(date);

            return (
              <div key={idx} className={`border-b border-r border-slate-100 p-2 min-h-[120px] relative hover:bg-slate-50/50 transition-colors ${idx % 7 === 6 ? 'border-r-0' : ''} ${!isCurrentMonth ? 'bg-slate-50/30' : ''}`}>
                <div className={`text-sm font-medium mb-2 ${isToday ? 'w-7 h-7 bg-teal-600 text-white flex items-center justify-center rounded-full' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                  {date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <div key={event.id} className={`p-1.5 rounded border text-xs cursor-pointer truncate ${event.type === 'Meeting' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                      event.type === 'Call' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                        'bg-teal-50 border-teal-100 text-teal-700'
                      }`}>
                      <span className="font-semibold mr-1">{event.start.getHours()}:{event.start.getMinutes().toString().padStart(2, '0')}</span>
                      {event.title}
                      {event.clientName && <span className="block opacity-75 text-[10px]">{event.clientName}</span>}
                      {event.advisorName && <span className="block opacity-75 text-[10px]">Adv: {event.advisorName}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Appointment">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Appointment Title</label>
            <input name="title" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Portfolio Review" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
              <input name="date" type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
              <input name="time" type="time" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Type</label>
            <select name="type" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="Meeting">Meeting</option>
              <option value="Call">Call</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors" disabled={isCreating}>Cancel</button>
            <button type="submit" className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50" disabled={isCreating}>
              {isCreating ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarView;