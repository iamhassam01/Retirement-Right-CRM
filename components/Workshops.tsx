import React, { useState } from 'react';
import { MOCK_WORKSHOPS } from '../constants';
import { Calendar, MapPin, Users, Edit2, Share2, X, Check, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

const Workshops: React.FC = () => {
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const WorkshopDetail = ({ workshop }: { workshop: any }) => (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
           <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">{workshop.status}</p>
           <h3 className="text-2xl font-bold text-navy-900">{workshop.title}</h3>
           <p className="text-slate-500 text-sm mt-1 flex items-center gap-2"><Calendar size={14}/> {workshop.date} • <MapPin size={14}/> Main Conference Room</p>
        </div>
        <div className="text-right">
           <p className="text-3xl font-bold text-navy-900">{workshop.registered}</p>
           <p className="text-xs text-slate-500 uppercase">Registered</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4">
         <h4 className="text-sm font-bold text-navy-900 mb-3">Attendee List</h4>
         <div className="space-y-2 max-h-64 overflow-y-auto">
            {[1,2,3,4,5].map(i => (
               <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">GP</div>
                     <div>
                        <p className="text-sm font-medium text-navy-900">Guest Person {i}</p>
                        <p className="text-xs text-slate-500">guest{i}@example.com</p>
                     </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Confirmed</span>
               </div>
            ))}
         </div>
      </div>

      <div className="flex gap-3 pt-4">
         <button className="flex-1 bg-navy-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-navy-800">Print Nametags</button>
         <button className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">Email Attendees</button>
      </div>
    </div>
  );

  const CreateEventForm = () => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const handleCreate = () => {
      setStatus('saving');
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setStatus('idle');
        }, 1000);
      }, 1000);
    };

    if (status === 'success') {
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
             <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Retirement Planning 2024" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Date</label>
                <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
             <div>
                <label className="block text-sm font-medium text-navy-900 mb-1">Time</label>
                <input type="time" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-navy-900 mb-1">Location</label>
             <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" defaultValue="Main Conference Room" />
          </div>
          <div>
             <label className="block text-sm font-medium text-navy-900 mb-1">Capacity</label>
             <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" defaultValue={20} />
          </div>
          <div className="pt-4 flex gap-3">
             <button onClick={() => setIsCreateModalOpen(false)} disabled={status === 'saving'} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
             <button onClick={handleCreate} disabled={status === 'saving'} className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                {status === 'saving' ? 'Creating...' : 'Create Event'}
             </button>
          </div>
       </div>
    );
  };

  return (
    <div className="p-8 animate-fade-in">
       <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-navy-900">Workshops & Events</h2>
           <p className="text-slate-500 text-sm">Manage educational seminars and client appreciation events.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 shadow-md"
        >
           + Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {MOCK_WORKSHOPS.map((workshop) => (
            <div key={workshop.id} onClick={() => setSelectedWorkshop(workshop)} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group cursor-pointer hover:border-teal-300 transition-all">
               <div className="h-32 bg-slate-200 relative">
                  <img 
                    src={`https://picsum.photos/600/300?random=${workshop.id}`} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                    alt="Event"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-navy-900 shadow-sm uppercase tracking-wide">
                     {workshop.status}
                  </div>
               </div>
               <div className="p-6">
                  <h3 className="text-lg font-bold text-navy-900 mb-2">{workshop.title}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                     <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        {workshop.date}
                     </div>
                     <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        Main Conference Room
                     </div>
                  </div>

                  <div className="space-y-2 mb-6">
                     <div className="flex justify-between text-sm font-medium">
                        <span className="text-navy-900">Registration</span>
                        <span className="text-teal-600">{workshop.registered} / {workshop.capacity}</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                           style={{ width: `${(workshop.registered / workshop.capacity) * 100}%` }}
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

      <Modal 
        isOpen={!!selectedWorkshop} 
        onClose={() => setSelectedWorkshop(null)} 
        title="Event Management"
      >
        {selectedWorkshop && <WorkshopDetail workshop={selectedWorkshop} />}
      </Modal>

      <Modal
         isOpen={isCreateModalOpen}
         onClose={() => setIsCreateModalOpen(false)}
         title="Create New Event"
      >
         <CreateEventForm />
      </Modal>
    </div>
  );
};

export default Workshops;