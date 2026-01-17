import React, { useState, useEffect } from 'react';
import { taskService } from '../services/task.service';
import { Task } from '../types';
import {
   CheckCircle2, Clock, Calendar, AlertCircle, Filter,
   Search, MoreHorizontal, ArrowRight, BellOff, Loader2,
   Plus, User, X
} from 'lucide-react';
import Modal from './Modal';

interface TasksProps {
   onSelectClient?: (clientId: string) => void;
}

const Tasks: React.FC<TasksProps> = ({ onSelectClient }) => {
   const [activeTab, setActiveTab] = useState<'todo' | 'completed'>('todo');
   const [tasks, setTasks] = useState<Task[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);
   const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
   const [selectedTask, setSelectedTask] = useState<Task | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [isSnoozing, setIsSnoozing] = useState(false);
   const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

   useEffect(() => {
      const fetchTasks = async () => {
         try {
            const data = await taskService.getAll();
            setTasks(data);
         } catch (error) {
            console.error('Failed to fetch tasks:', error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchTasks();
   }, []);

   // Filter tasks by status
   const todoTasks = tasks.filter(t => t.status !== 'Completed');
   const completedTasks = tasks.filter(t => t.status === 'Completed');

   const handleComplete = async (id: string) => {
      try {
         // Optimistic update - move to completed
         setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
         await taskService.update(id, { status: 'Completed' });
      } catch (error) {
         console.error('Failed to complete task:', error);
         // Revert on error
         setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Pending' } : t));
      }
   };

   const handleUncomplete = async (id: string) => {
      try {
         setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Pending' } : t));
         await taskService.update(id, { status: 'Pending' });
      } catch (error) {
         console.error('Failed to uncomplete task:', error);
         setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
      }
   };

   const handleSnooze = (task: Task) => {
      setSelectedTaskId(task.id);
      setSelectedTask(task);
      setSnoozeModalOpen(true);
   };

   const calculateSnoozeDate = (option: 'later_today' | 'tomorrow' | 'next_week'): Date => {
      const now = new Date();

      switch (option) {
         case 'later_today':
            // +4 hours from now
            return new Date(now.getTime() + 4 * 60 * 60 * 1000);

         case 'tomorrow':
            // Tomorrow at 9:00 AM
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            return tomorrow;

         case 'next_week':
            // Next Monday at 9:00 AM
            const nextMonday = new Date(now);
            const daysUntilMonday = (8 - now.getDay()) % 7 || 7; // If today is Monday, get next Monday
            nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
            nextMonday.setHours(9, 0, 0, 0);
            return nextMonday;

         default:
            return now;
      }
   };

   const confirmSnooze = async (option: 'later_today' | 'tomorrow' | 'next_week') => {
      if (!selectedTaskId) return;

      setIsSnoozing(true);
      try {
         const newDueDate = calculateSnoozeDate(option);

         // Optimistic update
         setTasks(prev => prev.map(t =>
            t.id === selectedTaskId
               ? { ...t, due: newDueDate.toISOString(), dueDate: newDueDate.toISOString() }
               : t
         ));

         await taskService.snooze(selectedTaskId, newDueDate);

         setSnoozeModalOpen(false);
         setSelectedTaskId(null);
         setSelectedTask(null);
      } catch (error) {
         console.error('Failed to snooze task:', error);
         // Refresh tasks on error
         const data = await taskService.getAll();
         setTasks(data);
      } finally {
         setIsSnoozing(false);
      }
   };

   const handleViewDetails = (task: Task) => {
      if (task.clientId && onSelectClient) {
         onSelectClient(task.clientId);
      }
   };

   const getSnoozeTimeLabel = (option: 'later_today' | 'tomorrow' | 'next_week'): string => {
      const date = calculateSnoozeDate(option);
      const now = new Date();

      if (option === 'later_today') {
         return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else if (option === 'tomorrow') {
         return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      } else {
         return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) +
            `, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      }
   };

   const currentTasks = activeTab === 'todo' ? todoTasks : completedTasks;

   const filteredTasks = currentTasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (t.clientName && t.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPriority = !priorityFilter || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
   });

   // Check if due date is overdue
   const isOverdue = (dueDate: string | undefined) => {
      if (!dueDate) return false;
      return new Date(dueDate) < new Date();
   };

   // Check if due date is today
   const isDueToday = (dueDate: string | undefined) => {
      if (!dueDate) return false;
      const today = new Date();
      const due = new Date(dueDate);
      return due.toDateString() === today.toDateString();
   };

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   return (
      <div className="p-8 h-full flex flex-col animate-fade-in">
         <div className="flex justify-between items-center mb-6">
            <div>
               <h2 className="text-2xl font-bold text-navy-900">Follow-ups & Reminders</h2>
               <p className="text-slate-500 text-sm">Stay on top of client commitments and compliance tasks.</p>
            </div>
            <div className="flex gap-3">
               <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                  <button
                     onClick={() => setActiveTab('todo')}
                     className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'todo' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
                  >
                     To Do ({todoTasks.length})
                  </button>
                  <button
                     onClick={() => setActiveTab('completed')}
                     className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'completed' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
                  >
                     Completed ({completedTasks.length})
                  </button>
               </div>
            </div>
         </div>

         {/* Filters */}
         <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
            </div>
            <div className="relative">
               <button
                  onClick={() => setPriorityFilter(priorityFilter ? null : 'High')}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${priorityFilter ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                     }`}
               >
                  <Filter size={16} />
                  {priorityFilter ? `Priority: ${priorityFilter}` : 'Priority'}
                  {priorityFilter && (
                     <X size={14} className="ml-1" onClick={(e) => { e.stopPropagation(); setPriorityFilter(null); }} />
                  )}
               </button>
            </div>
            <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden">
               {['High', 'Medium', 'Low'].map(p => (
                  <button
                     key={p}
                     onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                     className={`px-3 py-2 text-xs font-medium border-r last:border-r-0 transition-colors ${priorityFilter === p
                           ? p === 'High' ? 'bg-rose-50 text-rose-700'
                              : p === 'Medium' ? 'bg-amber-50 text-amber-700'
                                 : 'bg-slate-100 text-slate-700'
                           : 'text-slate-500 hover:bg-slate-50'
                        }`}
                  >
                     {p}
                  </button>
               ))}
            </div>
         </div>

         {/* Task List */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-y-auto">
            {filteredTasks.length > 0 ? (
               <div className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => (
                     <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-5">
                           <button
                              onClick={() => activeTab === 'todo' ? handleComplete(task.id) : handleUncomplete(task.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${activeTab === 'completed'
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 text-white hover:border-emerald-500 hover:bg-emerald-500'
                                 }`}
                           >
                              <CheckCircle2 size={14} />
                           </button>
                           <div>
                              <p className={`font-medium ${activeTab === 'completed' ? 'text-slate-400 line-through' : 'text-navy-900'}`}>
                                 {task.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                 <span className={`flex items-center gap-1 ${isOverdue(task.due || task.dueDate) ? 'text-rose-500 font-medium' :
                                       isDueToday(task.due || task.dueDate) ? 'text-amber-500' : 'text-slate-500'
                                    }`}>
                                    <Clock size={14} />
                                    {task.due || task.dueDate
                                       ? isOverdue(task.due || task.dueDate)
                                          ? `Overdue: ${new Date(task.due || task.dueDate!).toLocaleDateString()}`
                                          : isDueToday(task.due || task.dueDate)
                                             ? 'Due Today'
                                             : new Date(task.due || task.dueDate!).toLocaleDateString()
                                       : 'No due date'}
                                 </span>
                                 {task.clientName && (
                                    <>
                                       <span className="text-slate-300">•</span>
                                       <span
                                          className={`flex items-center gap-1 ${task.clientId && onSelectClient ? 'text-teal-600 font-medium cursor-pointer hover:underline' : 'text-teal-600'}`}
                                          onClick={() => task.clientId && onSelectClient && handleViewDetails(task)}
                                       >
                                          <User size={12} />
                                          {task.clientName}
                                       </span>
                                    </>
                                 )}
                                 <span className="text-slate-300">•</span>
                                 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {task.priority}
                                 </span>
                              </div>
                              {task.description && (
                                 <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                              )}
                           </div>
                        </div>

                        {activeTab === 'todo' && (
                           <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                 onClick={() => handleSnooze(task)}
                                 className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                              >
                                 <BellOff size={14} /> Snooze
                              </button>
                              {task.clientId && onSelectClient && (
                                 <button
                                    onClick={() => handleViewDetails(task)}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg flex items-center gap-2"
                                 >
                                    Details <ArrowRight size={14} />
                                 </button>
                              )}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                     {activeTab === 'todo' ? (
                        <CheckCircle2 size={32} className="text-emerald-500" />
                     ) : (
                        <Clock size={32} className="text-slate-400" />
                     )}
                  </div>
                  <h3 className="text-lg font-medium text-navy-900">
                     {activeTab === 'todo' ? 'All caught up!' : 'No completed tasks'}
                  </h3>
                  <p className="text-sm">
                     {activeTab === 'todo' ? 'No pending tasks for today.' : 'Complete some tasks to see them here.'}
                  </p>
               </div>
            )}
         </div>

         {/* Snooze Modal */}
         <Modal isOpen={snoozeModalOpen} onClose={() => { setSnoozeModalOpen(false); setSelectedTask(null); }} title="Snooze Task">
            <div className="space-y-4">
               {selectedTask && (
                  <div className="p-3 bg-slate-50 rounded-lg mb-4">
                     <p className="font-medium text-navy-900">{selectedTask.title}</p>
                     {selectedTask.clientName && (
                        <p className="text-sm text-slate-500 mt-1">Client: {selectedTask.clientName}</p>
                     )}
                  </div>
               )}
               <p className="text-sm text-slate-600">Select when you want to be reminded about this task again.</p>
               <div className="grid grid-cols-1 gap-2">
                  <button
                     onClick={() => confirmSnooze('later_today')}
                     disabled={isSnoozing}
                     className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group disabled:opacity-50"
                  >
                     <div className="p-2 bg-slate-100 rounded group-hover:bg-white text-navy-900"><Clock size={16} /></div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-navy-900">Later Today</p>
                        <p className="text-xs text-slate-500">{getSnoozeTimeLabel('later_today')}</p>
                     </div>
                  </button>
                  <button
                     onClick={() => confirmSnooze('tomorrow')}
                     disabled={isSnoozing}
                     className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group disabled:opacity-50"
                  >
                     <div className="p-2 bg-slate-100 rounded group-hover:bg-white text-navy-900"><Calendar size={16} /></div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-navy-900">Tomorrow Morning</p>
                        <p className="text-xs text-slate-500">{getSnoozeTimeLabel('tomorrow')}</p>
                     </div>
                  </button>
                  <button
                     onClick={() => confirmSnooze('next_week')}
                     disabled={isSnoozing}
                     className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group disabled:opacity-50"
                  >
                     <div className="p-2 bg-slate-100 rounded group-hover:bg-white text-navy-900"><Calendar size={16} /></div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-navy-900">Next Week</p>
                        <p className="text-xs text-slate-500">{getSnoozeTimeLabel('next_week')}</p>
                     </div>
                  </button>
               </div>
               {isSnoozing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-teal-600">
                     <Loader2 className="animate-spin" size={16} />
                     Updating task...
                  </div>
               )}
            </div>
         </Modal>
      </div>
   );
};

export default Tasks;