import React, { useState } from 'react';
import { KPIData, Task, Workshop } from '../types';
import { KPI_STATS, MOCK_TASKS, MOCK_WORKSHOPS } from '../constants';
import { Clock, CheckCircle2, ChevronRight, Calendar as CalIcon, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
  onSelectClient: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectClient }) => {
  // Local state to handle task completion for the demo
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const handleCompleteTask = (taskId: string) => {
    // Add a fade-out effect then remove
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-navy-900">Good Morning, John</h2>
          <p className="text-slate-500 mt-1">Here is your agenda for today, October 27th.</p>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Market Update: S&P 500 +0.4%
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI_STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${stat.isPositive === false ? 'bg-rose-50' : 'bg-slate-50'}`}>
                  <Icon size={20} className={stat.isPositive === false ? 'text-rose-500' : 'text-navy-900'} />
                </div>
                {stat.change && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.isPositive 
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
          );
        })}
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
                tasks.map((task) => (
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
                            // Mock logic to navigate to a client if name matches known mocks
                            if(task.clientName.includes('Sterling')) onSelectClient('1');
                            else if(task.clientName.includes('Finch')) onSelectClient('4');
                            else if(task.clientName.includes('Vance')) onSelectClient('2');
                          }}
                          className="text-sm font-medium text-navy-900 group-hover:text-teal-600 transition-colors text-left"
                        >
                          {task.title}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-400">• {task.clientName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 gap-2">
                      <Clock size={14} />
                      {task.due}
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

          {/* Upcoming Workshops */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-navy-900">Upcoming Workshops</h3>
              <button 
                onClick={() => onNavigate('workshops')}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                Manage Events
              </button>
            </div>
            <div className="p-6 grid gap-4">
              {MOCK_WORKSHOPS.slice(0, 2).map((workshop) => (
                <div key={workshop.id} className="flex items-center p-4 border border-slate-100 rounded-lg hover:border-teal-100 transition-all cursor-pointer" onClick={() => onNavigate('workshops')}>
                  <div className="h-12 w-12 bg-navy-50 rounded-lg flex flex-col items-center justify-center text-navy-900 mr-4">
                    <span className="text-[10px] font-bold uppercase">{workshop.date.split(' ')[0]}</span>
                    <span className="text-lg font-bold">{workshop.date.split(' ')[1].replace(',', '')}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-navy-900">{workshop.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{workshop.registered} / {workshop.capacity} Registered</p>
                  </div>
                  <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full" 
                      style={{ width: `${(workshop.registered / workshop.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
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
              <div 
                 onClick={() => onSelectClient('1')}
                 className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-100 pl-4 last:pb-0 last:border-0 cursor-pointer group"
              >
                 <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white bg-teal-500 shadow-sm group-hover:scale-110 transition-transform"></div>
                 <div>
                   <span className="text-xs font-semibold text-slate-400 block mb-1">10:00 AM - 11:30 AM</span>
                   <p className="text-sm font-medium text-navy-900 group-hover:text-teal-600 transition-colors">Review with Robert & Martha</p>
                   <span className="text-xs text-slate-500">Conference Room A</span>
                 </div>
              </div>
              <div 
                 onClick={() => onSelectClient('3')}
                 className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-100 pl-4 last:pb-0 last:border-0 cursor-pointer group"
              >
                 <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-4 border-white bg-navy-400 shadow-sm group-hover:scale-110 transition-transform"></div>
                 <div>
                   <span className="text-xs font-semibold text-slate-400 block mb-1">2:00 PM - 2:30 PM</span>
                   <p className="text-sm font-medium text-navy-900 group-hover:text-teal-600 transition-colors">Lead Call: David Chen</p>
                   <span className="text-xs text-slate-500">Zoom Meeting</span>
                 </div>
              </div>
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
            <p className="text-navy-200 text-sm mb-6">You have 3 prospects ready for proposals this week.</p>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs opacity-80">
                <span>Leads</span>
                <span>Onboarding</span>
              </div>
              <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 w-3/4 rounded-full"></div>
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