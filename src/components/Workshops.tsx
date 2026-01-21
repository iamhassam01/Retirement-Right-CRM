import React, { useState, useEffect } from 'react';
import { workshopService, Workshop } from '../services/workshop.service';
import { Calendar, MapPin, Users, Edit2, Share2, Loader2, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

const Workshops: React.FC = () => {
   const [workshops, setWorkshops] = useState<Workshop[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

   // Form state
   const [formTitle, setFormTitle] = useState('');
   const [formDate, setFormDate] = useState('');
   const [formTime, setFormTime] = useState('');
   const [formLocation, setFormLocation] = useState('Main Conference Room');
   const [formCapacity, setFormCapacity] = useState(20);
   const [createStatus, setCreateStatus] = useState<'idle' | 'saving' | 'success'>('idle');

   useEffect(() => {
      fetchWorkshops();
   }, []);

   const fetchWorkshops = async () => {
      try {
         setIsLoading(true);
         const data = await workshopService.getAll();
         setWorkshops(data);
      } catch (error) {
         console.error('Failed to fetch workshops:', error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleCreateWorkshop = async () => {
      if (!formTitle || !formDate || !formTime) return;

      setCreateStatus('saving');
      try {
         const startDateTime = new Date(`${formDate}T${formTime}`);
         const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

         const newWorkshop = await workshopService.create({
            title: formTitle,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            location: formLocation,
            capacity: formCapacity,
            status: 'Scheduled'
         });

         setWorkshops(prev => [...prev, newWorkshop]);
         setCreateStatus('success');
         setTimeout(() => {
            setIsCreateModalOpen(false);
            setCreateStatus('idle');
            resetForm();
         }, 1500);
      } catch (error) {
         console.error('Failed to create workshop:', error);
         setCreateStatus('idle');
      }
   };

   const resetForm = () => {
      setFormTitle('');
      setFormDate('');
      setFormTime('');
      setFormLocation('Main Conference Room');
      setFormCapacity(20);
   };

   const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });
   };

   const getStatusLabel = (workshop: Workshop) => {
      const now = new Date();
      const startTime = new Date(workshop.startTime);
      if (startTime > now) return 'Upcoming';
      if (workshop.status === 'Completed') return 'Completed';
      return 'Ongoing';
   };

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   const WorkshopDetail = ({ workshop }: { workshop: Workshop }) => (
      <div className="space-y-6">
         <div className="flex justify-between items-start">
            <div>
               <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">{getStatusLabel(workshop)}</p>
               <h3 className="text-2xl font-bold text-navy-900">{workshop.title}</h3>
               <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                  <Calendar size={14} /> {formatDate(workshop.startTime)} • <MapPin size={14} /> {workshop.location || 'TBD'}
               </p>
            </div>
            <div className="text-right">
               <p className="text-3xl font-bold text-navy-900">{workshop.registered || 0}</p>
               <p className="text-xs text-slate-500 uppercase">Registered</p>
            </div>
         </div>

         <div className="border-t border-slate-100 pt-4">
            <h4 className="text-sm font-bold text-navy-900 mb-3">Event Details</h4>
            <div className="text-sm text-slate-600 space-y-2">
               <p><strong>Capacity:</strong> {workshop.capacity || 'Unlimited'}</p>
               <p><strong>Status:</strong> {workshop.status}</p>
            </div>
         </div>

         <div className="flex gap-3 pt-4">
            <button className="flex-1 bg-navy-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-navy-800">View Registrations</button>
            <button className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Email Attendees</button>
         </div>
      </div>
   );

   const CreateEventForm = () => {
      if (createStatus === 'success') {
         return (
            <div className="h-64 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in">
                  <CheckCircle2 size={32} />
               </div>
               <h3 className="text-lg font-bold text-navy-900">Event Created!</h3>
               <p className="text-slate-500">The event has been scheduled and invitations are ready.</p>
            </div>
         );
      }

      return (
         <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">Event Title</label>
               <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Retirement Planning 2024"
               />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
                  <input
                     type="date"
                     value={formDate}
                     onChange={(e) => setFormDate(e.target.value)}
                     className="w-full px-3 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
                  <input
                     type="time"
                     value={formTime}
                     onChange={(e) => setFormTime(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
               </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">Location</label>
               <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">Capacity</label>
               <input
                  type="number"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
            </div>
            <div className="pt-4 flex gap-3">
               <button
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createStatus === 'saving'}
                  className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
               >
                  Cancel
               </button>
               <button
                  onClick={handleCreateWorkshop}
                  disabled={createStatus === 'saving' || !formTitle || !formDate || !formTime}
                  className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
               >
                  {createStatus === 'saving' ? <><Loader2 className="animate-spin" size={16} /> Creating...</> : 'Create Event'}
               </button>
            </div>
         </div>
      );
   };

   return (
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
               <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Workshops & Events</h2>
               <p className="text-slate-500 text-xs sm:text-sm">Manage educational seminars and client appreciation events.</p>
            </div>
            <button
               onClick={() => setIsCreateModalOpen(true)}
               className="px-4 sm:px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 active:bg-navy-700 shadow-md min-h-[44px]"
            >
               + Create Event
            </button>
         </div>

         {workshops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
               {workshops.map((workshop) => (
                  <div key={workshop.id} onClick={() => setSelectedWorkshop(workshop)} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group cursor-pointer hover:border-teal-300 transition-all">
                     <div className="h-32 bg-gradient-to-br from-teal-500 to-navy-800 relative flex items-center justify-center">
                        <Calendar size={48} className="text-white/50" />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-navy-900 shadow-sm uppercase tracking-wide">
                           {getStatusLabel(workshop)}
                        </div>
                     </div>
                     <div className="p-6">
                        <h3 className="text-lg font-bold text-navy-900 mb-2">{workshop.title}</h3>

                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                           <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              {formatDate(workshop.startTime)}
                           </div>
                           <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              {workshop.location || 'TBD'}
                           </div>
                        </div>

                        <div className="space-y-2 mb-6">
                           <div className="flex justify-between text-sm font-medium">
                              <span className="text-navy-900">Registration</span>
                              <span className="text-teal-600">{workshop.registered || 0} / {workshop.capacity || '∞'}</span>
                           </div>
                           <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                 style={{ width: `${workshop.capacity ? ((workshop.registered || 0) / workshop.capacity) * 100 : 0}%` }}
                              />
                           </div>
                        </div>

                        <div className="flex gap-3 border-t border-slate-100 pt-4">
                           <button className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                              <Edit2 size={14} /> Details
                           </button>
                           <button className="flex-1 py-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 text-sm font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-2">
                              <Share2 size={14} /> Invite
                           </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="text-center py-24 bg-white rounded-xl border border-slate-200">
               <Calendar size={64} className="mx-auto mb-4 text-slate-300" />
               <h3 className="text-xl font-bold text-navy-900 mb-2">No Events Yet</h3>
               <p className="text-slate-500 mb-6">Create your first workshop or event to get started</p>
               <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800"
               >
                  + Create Event
               </button>
            </div>
         )}

         <Modal
            isOpen={!!selectedWorkshop}
            onClose={() => setSelectedWorkshop(null)}
            title="Event Management"
         >
            {selectedWorkshop && <WorkshopDetail workshop={selectedWorkshop} />}
         </Modal>

         <Modal
            isOpen={isCreateModalOpen}
            onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
            title="Create New Event"
         >
            <CreateEventForm />
         </Modal>
      </div>
   );
};

export default Workshops;