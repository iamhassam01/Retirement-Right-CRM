import React, { useState, useEffect } from 'react';
import { taskService } from '../services/task.service';
import { Task } from '../types';
import {
   CheckCircle2, Clock, Calendar, AlertCircle, Filter,
   Search, MoreHorizontal, ArrowRight, BellOff, Loader2
} from 'lucide-react';
import Modal from './Modal';

const Tasks: React.FC = () => {
   const [activeTab, setActiveTab] = useState('todo');
   const [tasks, setTasks] = useState<Task[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);
   const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
   const [searchTerm, setSearchTerm] = useState('');

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

   const handleComplete = async (id: string) => {
      try {
         // Optimistic update
         setTasks(prev => prev.filter(t => t.id !== id));
         await taskService.delete(id);
      } catch (error) {
         console.error('Failed to complete task:', error);
      }
   };

   const handleSnooze = (id: string) => {
      setSelectedTaskId(id);
      setSnoozeModalOpen(true);
   };

   const confirmSnooze = async () => {
      if (selectedTaskId) {
         // Remove from current view
         setTasks(prev => prev.filter(t => t.id !== selectedTaskId));
         setSnoozeModalOpen(false);
         setSelectedTaskId(null);
      }
   };

   const filteredTasks = tasks.filter(t =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.clientName && t.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
   );

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
                     To Do
                  </button>
                  <button
                     onClick={() => setActiveTab('completed')}
                     className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'completed' ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-500 hover:text-navy-900'}`}
                  >
                     Completed
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
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
               <Filter size={16} /> Priority
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
               <Calendar size={16} /> Due Date
            </button>
         </div>

         {/* Task List */}
         <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-y-auto">
            {filteredTasks.length > 0 ? (
               <div className="divide-y divide-slate-100">
                  {filteredTasks.map((task, index) => (
                     <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-5">
                           <button
                              onClick={() => handleComplete(task.id)}
                              className="w-6 h-6 rounded-full border-2 border-slate-300 text-white flex items-center justify-center hover:border-emerald-500 hover:bg-emerald-500 transition-all"
                           >
                              <CheckCircle2 size={14} />
                           </button>
                           <div>
                              <p className="text-navy-900 font-medium">{task.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                 <span className="text-slate-500 flex items-center gap-1">
                                    <Clock size={14} /> {task.due ? new Date(task.due).toLocaleDateString() : 'No due date'}
                                 </span>
                                 {task.clientName && (
                                    <>
                                       <span className="text-slate-300">•</span>
                                       <span className="text-teal-600 font-medium">{task.clientName}</span>
                                    </>
                                 )}
                                 <span className="text-slate-300">•</span>
                                 <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                                       task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {task.priority}
                                 </span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button
                              onClick={() => handleSnooze(task.id)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg flex items-center gap-2"
                           >
                              <BellOff size={14} /> Snooze
                           </button>
                           <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg flex items-center gap-2">
                              Details <ArrowRight size={14} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-medium text-navy-900">All caught up!</h3>
                  <p className="text-sm">No pending tasks for today.</p>
               </div>
            )}
         </div>

         <Modal isOpen={snoozeModalOpen} onClose={() => setSnoozeModalOpen(false)} title="Snooze Task">
            <div className="space-y-4">
               <p className="text-sm text-slate-600">Select when you want to be reminded about this task again.</p>
               <div className="grid grid-cols-1 gap-2">
                  <button onClick={confirmSnooze} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group">
                     <div className="p-2 bg-slate-100 rounded group-hover:bg-white text-navy-900"><Clock size={16} /></div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-navy-900">Later Today</p>
                        <p className="text-xs text-slate-500">Remind me in 4 hours</p>
                     </div>
                  </button>
                  <button onClick={confirmSnooze} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group">
                     <div className="p-2 bg-slate-100 rounded group-hover:bg-white text-navy-900"><Calendar size={16} /></div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-navy-900">Tomorrow Morning</p>
                        <p className="text-xs text-slate-500">9:00 AM</p>
                     </div>
                  </button>
                  <button onClick={confirmSnooze} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-all text-left group">
                     <div className="p-2 bg-slate-100 rounded group-hover:bg-white text-navy-900"><Calendar size={16} /></div>
                     <div className="flex-1">
                        <p className="text-sm font-medium text-navy-900">Next Week</p>
                        <p className="text-xs text-slate-500">Monday, 9:00 AM</p>
                     </div>
                  </button>
               </div>
            </div>
         </Modal>
      </div>
   );
};

export default Tasks;