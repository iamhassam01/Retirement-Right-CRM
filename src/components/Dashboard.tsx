import React, { useState, useEffect } from 'react';
import { KPIData, Task, CalendarEvent } from '../types';
import { dashboardService } from '../services/dashboard.service';
import { taskService } from '../services/task.service';
import { eventService } from '../services/event.service';
import { Clock, CheckCircle2, Calendar as CalIcon, ArrowRight, Loader2, DollarSign, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { clientService } from '../services/client.service';

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

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectClient }) => {
  const [stats, setStats] = useState<KPIData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pipelineStats, setPipelineStats] = useState({ leads: 0, qualified: 0, proposal: 0, onboarding: 0, active: 0 });

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
        setEvents(eventsData);

        // Fetch pipeline stats from clients
        try {
          const clients = await clientService.getAll();
          const stats = {
            leads: clients.filter((c: any) => c.pipelineStage === 'New Lead' || c.pipelineStage === 'Lead').length,
            qualified: clients.filter((c: any) => c.pipelineStage === 'Qualified').length,
            proposal: clients.filter((c: any) => c.pipelineStage === 'Proposal').length,
            onboarding: clients.filter((c: any) => c.pipelineStage === 'Onboarding').length,
            active: clients.filter((c: any) => c.status === 'Client' || c.pipelineStage === 'Active').length
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
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-navy-900">Good Morning</h2>
          <p className="text-slate-500 mt-1">Here is your agenda for today.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg ${stat.isPositive === false ? 'bg-rose-50' : 'bg-slate-50'}`}>
                {getKPIIcon(stat.label)}
              </div>
              {stat.change && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.isPositive
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-rose-600 bg-rose-50'
                  }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-navy-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area - 2 Cols */}
        <div className="lg:col-span-2 space-y-8">

          {/* Today's Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-navy-900">Priority Actions</h3>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {tasks.length > 0 ? (
                tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group animate-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="text-slate-300 hover:text-emerald-500 hover:scale-110 transition-all"
                        title="Mark as Complete"
                      >
                        <CheckCircle2 size={24} />
                      </button>
                      <div>
                        <button
                          onClick={() => {
                            if (task.clientName) {
                              onNavigate('clients');
                            }
                          }}
                          className="text-sm font-medium text-navy-900 group-hover:text-teal-600 transition-colors text-left"
                        >
                          {task.title}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {task.priority || 'Normal'}
                          </span>
                          {task.clientName && <span className="text-xs text-slate-400">• {task.clientName}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <Clock size={14} />
                      {task.due ? new Date(task.due).toLocaleDateString() : 'No due date'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <div className="inline-flex p-3 rounded-full bg-slate-50 mb-3">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-sm">All priority tasks completed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Workshops/Events */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-navy-900">Upcoming Events</h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                View Calendar
              </button>
            </div>
            <div className="p-6 grid gap-4">
              {events.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center p-4 border border-slate-100 rounded-lg hover:border-teal-100 transition-all cursor-pointer" onClick={() => onNavigate('calendar')}>
                  <div className="h-12 w-12 bg-navy-50 rounded-lg flex flex-col items-center justify-center text-navy-900 mr-4">
                    <span className="text-[10px] font-bold uppercase">{safeFormatDate(event.start, { month: 'short' })}</span>
                    <span className="text-lg font-bold">{safeGetDate(event.start)}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-navy-900">{event.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {event.type}
                      {event.clientName && ` • ${event.clientName}`}
                      {event.advisorName && ` • Advisor: ${event.advisorName}`}
                    </p>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-slate-400 text-sm">No upcoming events.</p>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Area - 1 Col */}
        <div className="space-y-8">

          {/* Calendar Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <CalIcon size={18} /> Schedule
            </h3>
            <div className="space-y-4">
              {events.slice(0, 3).map(event => (
                <div key={event.id} className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-100 pl-4 last:pb-0 last:border-0">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white bg-teal-500 shadow-sm"></div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">
                      {safeFormatTime(event.start)}
                    </span>
                    <p className="text-sm font-medium text-navy-900">{event.title}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="w-full mt-6 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              View Full Calendar
            </button>
          </div>

          {/* Quick Stats / Mini Pipeline */}
          <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-semibold mb-2">Pipeline Velocity</h3>
            <p className="text-navy-200 text-sm mb-6">Track your prospects.</p>

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
              className="mt-6 flex items-center justify-between w-full text-sm font-medium text-teal-300 hover:text-white transition-colors"
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