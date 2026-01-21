import React, { useState, useEffect } from 'react';
import { KPIData, Task, CalendarEvent } from '../types';
import { dashboardService } from '../services/dashboard.service';
import { taskService } from '../services/task.service';
import { eventService } from '../services/event.service';
import { Clock, CheckCircle2, Calendar as CalIcon, ArrowRight, Loader2, DollarSign, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { clientService } from '../services/client.service';
import { useResponsiveView } from '../hooks/useMediaQuery';

interface DashboardProps {
  onNavigate: (view: string) => void;
  onSelectClient: (id: string) => void;
}

// Helper to safely format date
const safeFormatDate = (date: Date | string | undefined, options: Intl.DateTimeFormatOptions): string => {
  if (!date) return '--';
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? '--' : d.toLocaleString('default', options);
};

const safeGetDate = (date: Date | string | undefined): number | string => {
  if (!date) return '--';
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? '--' : d.getDate();
};

const safeFormatTime = (date: Date | string | undefined): string => {
  if (!date) return '--:--';
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format full date with day, month, year and time
const formatFullDateTime = (date: Date | string | undefined): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectClient }) => {
  const [stats, setStats] = useState<KPIData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [workshops, setWorkshops] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pipelineStats, setPipelineStats] = useState({ leads: 0, qualified: 0, proposal: 0, onboarding: 0, active: 0 });
  const { isMobile, isTablet } = useResponsiveView();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, tasksData, eventsData] = await Promise.all([
          dashboardService.getStats(),
          taskService.getAll(),
          eventService.getAll(),
        ]);
        setStats(statsData);
        setTasks(tasksData);
        // Filter: Only show events from TODAY onwards (not past)
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        const upcomingEvents = eventsData.filter((e: CalendarEvent) => new Date(e.start) >= now);
        // Appointments are Meeting/Call, Workshops are separate
        setAppointments(upcomingEvents.filter((e: CalendarEvent) => e.type !== 'Workshop'));
        setWorkshops(upcomingEvents.filter((e: CalendarEvent) => e.type === 'Workshop'));

        // Fetch pipeline stats from clients
        try {
          const clients = await clientService.getAll();
          const stats = {
            leads: clients.filter((c: any) => c.pipelineStage === 'New Lead' || c.pipelineStage === 'Lead').length,
            qualified: clients.filter((c: any) => c.pipelineStage === 'Qualified').length,
            proposal: clients.filter((c: any) => c.pipelineStage === 'Proposal').length,
            onboarding: clients.filter((c: any) => c.pipelineStage === 'Onboarding').length,
            active: clients.filter((c: any) => c.status === 'Client' || c.status === 'Active' || c.pipelineStage === 'Active' || c.pipelineStage === 'Client Onboarded').length
          };
          setPipelineStats(stats);
        } catch (e) {
          console.error('Failed to fetch pipeline stats:', e);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      // Optimistic update
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await taskService.delete(taskId);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  // Helper to get icon based on stat label
  const getKPIIcon = (label: string) => {
    switch (label) {
      case 'Total AUM': return <DollarSign size={20} className="text-emerald-600" />;
      case 'Active Clients': return <Users size={20} className="text-blue-600" />;
      case 'Appointments Today': return <CalIcon size={20} className="text-indigo-600" />;
      case 'Pending Follow-ups': return <AlertCircle size={20} className="text-amber-600" />;
      default: return <TrendingUp size={20} className="text-slate-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-navy-900" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-navy-900">Good Morning</h2>
          <p className="text-slate-500 text-sm mt-0.5 sm:mt-1">Here is your agenda for today.</p>
        </div>
      </div>

      {/* KPI Cards - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {stats.map((stat, idx) => {
          // Determine navigation target based on KPI label
          const getNavTarget = (label: string) => {
            switch (label) {
              case 'Active Clients': return 'clients';
              case 'Appointments Today': return 'calendar';
              case 'Pending Follow-ups': return 'tasks';
              case 'Total AUM': return 'reports';
              default: return null;
            }
          };
          const navTarget = getNavTarget(stat.label);

          return (
            <div
              key={idx}
              onClick={() => navTarget && onNavigate(navTarget)}
              className={`bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 ${navTarget ? 'cursor-pointer hover:border-teal-200 active:scale-[0.98] active:bg-slate-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-2 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg ${stat.isPositive === false ? 'bg-rose-50' : 'bg-slate-50'}`}>
                  {getKPIIcon(stat.label)}
                </div>
                {stat.change && (
                  <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${stat.isPositive
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-rose-600 bg-rose-50'
                    }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium truncate">{stat.label}</h3>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-navy-900 mt-0.5 sm:mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content - Stack on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Main Content Area - 2 Cols on desktop */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2 text-sm sm:text-base"><CalIcon size={18} /> Upcoming Appointments</h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline min-h-[44px] flex items-center"
              >
                View Calendar
              </button>
            </div>
            <div className="p-3 sm:p-6 grid gap-3 sm:gap-4">
              {appointments.slice(0, isMobile ? 2 : 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center p-3 sm:p-4 border border-slate-100 rounded-lg hover:border-teal-100 active:bg-slate-50 transition-all cursor-pointer min-h-[64px]"
                  onClick={() => onNavigate('calendar')}
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-navy-50 rounded-lg flex flex-col items-center justify-center text-navy-900 mr-3 sm:mr-4 flex-shrink-0">
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase">{safeFormatDate(event.start, { month: 'short' })}</span>
                    <span className="text-base sm:text-lg font-bold">{safeGetDate(event.start)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-navy-900 text-sm sm:text-base truncate">{event.title}</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
                      {formatFullDateTime(event.start)}
                      {event.clientName && ` • ${event.clientName}`}
                    </p>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No upcoming appointments.</p>
              )}
            </div>
          </div>

          {/* Upcoming Workshops */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2 text-sm sm:text-base"><CalIcon size={18} /> Upcoming Workshops</h3>
              <button
                onClick={() => onNavigate('workshops')}
                className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline min-h-[44px] flex items-center"
              >
                View All
              </button>
            </div>
            <div className="p-3 sm:p-6 grid gap-3 sm:gap-4">
              {workshops.slice(0, isMobile ? 2 : 3).map((wkshp) => (
                <div
                  key={wkshp.id}
                  className="flex items-center p-3 sm:p-4 border border-slate-100 rounded-lg hover:border-emerald-100 active:bg-slate-50 transition-all cursor-pointer min-h-[64px]"
                  onClick={() => onNavigate('workshops')}
                >
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-50 rounded-lg flex flex-col items-center justify-center text-emerald-700 mr-3 sm:mr-4 flex-shrink-0">
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase">{safeFormatDate(wkshp.start, { month: 'short' })}</span>
                    <span className="text-base sm:text-lg font-bold">{safeGetDate(wkshp.start)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-navy-900 text-sm sm:text-base truncate">{wkshp.title}</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
                      {formatFullDateTime(wkshp.start)}
                    </p>
                  </div>
                </div>
              ))}
              {workshops.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No upcoming workshops.</p>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Area - Priority Actions + Pipeline (shows below on mobile) */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">

          {/* Priority Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="font-semibold text-navy-900 flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle2 size={18} /> Priority Actions
              </h3>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline min-h-[44px] flex items-center"
              >
                View All
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {tasks.length > 0 ? tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors">
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="text-slate-300 hover:text-emerald-500 active:text-emerald-600 mt-0.5 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}>
                        {task.priority || 'Normal'}
                      </span>
                      {task.due && <span className="text-[10px] text-slate-400">{new Date(task.due).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-slate-400">
                  <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs">All tasks completed!</p>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Velocity */}
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl shadow-lg p-4 sm:p-6 text-white">
            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Pipeline Velocity</h3>
            <p className="text-navy-200 text-xs sm:text-sm mb-4 sm:mb-6">Track your prospects.</p>

            <div className="space-y-4">
              {/* Pipeline Stage Bars */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-navy-200">New Leads</span>
                  <span className="font-semibold text-teal-400">{pipelineStats.leads}</span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${Math.min(100, pipelineStats.leads * 10)}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-navy-200">Qualified</span>
                  <span className="font-semibold text-emerald-400">{pipelineStats.qualified}</span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, pipelineStats.qualified * 15)}%` }}></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-navy-200">Onboarding</span>
                  <span className="font-semibold text-amber-400">{pipelineStats.onboarding}</span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, pipelineStats.onboarding * 20)}%` }}></div>
                </div>
              </div>

              <div className="pt-2 border-t border-navy-700 flex justify-between text-xs">
                <span className="text-navy-200">Active Clients</span>
                <span className="font-bold text-white">{pipelineStats.active}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('pipeline')}
              className="mt-4 sm:mt-6 flex items-center justify-between w-full text-sm font-medium text-teal-300 hover:text-white active:text-teal-100 transition-colors min-h-[44px]"
            >
              Go to Pipeline <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
