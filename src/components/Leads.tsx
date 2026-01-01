import React, { useState, useEffect } from 'react';
import { clientService } from '../services/client.service';
import { Client } from '../types';
import { Search, Filter, Phone, Mail, ArrowRight, Loader2 } from 'lucide-react';
import Modal from './Modal';

interface LeadsProps {
   onSelectClient: (id: string) => void;
}

const Leads: React.FC<LeadsProps> = ({ onSelectClient }) => {
   const [convertModalOpen, setConvertModalOpen] = useState(false);
   const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<string | null>(null);
   const [leads, setLeads] = useState<Client[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      const fetchLeads = async () => {
         try {
            const data = await clientService.getAll();
            // Filter for only prospects/leads
            setLeads(data.filter((c: Client) => c.status === 'Lead' || c.status === 'Prospect'));
         } catch (error) {
            console.error('Failed to fetch leads:', error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchLeads();
   }, []);

   const handleConvertClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSelectedLeadForConversion(id);
      setConvertModalOpen(true);
   };

   const handleConvert = async () => {
      if (selectedLeadForConversion) {
         try {
            await clientService.update(selectedLeadForConversion, { status: 'Active' });
            setLeads(prev => prev.filter(l => l.id !== selectedLeadForConversion));
            setConvertModalOpen(false);
         } catch (error) {
            console.error('Failed to convert lead:', error);
         }
      }
   };

   const filteredLeads = leads.filter(l =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase())
   );

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   return (
      <div className="p-8 h-full flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <div>
               <h2 className="text-2xl font-bold text-navy-900">Leads Management</h2>
               <p className="text-slate-500 text-sm">Review incoming inquiries and active prospects.</p>
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
            {/* Table Actions */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
               <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                     type="text"
                     placeholder="Search by name, source, or tag..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
               </div>
               <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                     <Filter size={16} /> Filter
                  </button>
               </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
               <div className="col-span-4">Name & Contact</div>
               <div className="col-span-2">Status</div>
               <div className="col-span-3">Phone</div>
               <div className="col-span-2">Last Contact</div>
               <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
               {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                     <p className="text-sm">No leads found. Add your first lead!</p>
                  </div>
               ) : (
                  filteredLeads.map(lead => (
                     <div key={lead.id} onClick={() => onSelectClient(lead.id)} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors group cursor-pointer">
                        <div className="col-span-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                           </div>
                           <div>
                              <span className="font-medium text-navy-900 hover:text-teal-600 text-sm block">
                                 {lead.name}
                              </span>
                              <span className="text-xs text-slate-400">{lead.email || '-'}</span>
                           </div>
                        </div>
                        <div className="col-span-2">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === 'Prospect' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                              }`}>
                              {lead.status}
                           </span>
                        </div>
                        <div className="col-span-3">
                           <p className="text-sm text-slate-700">{lead.phone || '-'}</p>
                        </div>
                        <div className="col-span-2">
                           <p className="text-sm text-slate-600">
                              {lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : 'Never'}
                           </p>
                        </div>
                        <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded">
                              <Phone size={16} />
                           </button>
                           <button
                              title="Convert to Client"
                              onClick={(e) => handleConvertClick(e, lead.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                           >
                              <ArrowRight size={16} />
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>

         {/* Convert Modal */}
         <Modal
            isOpen={convertModalOpen}
            onClose={() => setConvertModalOpen(false)}
            title="Convert Lead to Client"
         >
            <div className="space-y-4">
               <p className="text-sm text-slate-600">You are about to promote this lead to an active client.</p>

               <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs">
                  <input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" />
                  <span>I confirm that initial compliance disclosure has been sent.</span>
               </div>

               <div className="pt-2 flex gap-3">
                  <button onClick={() => setConvertModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={handleConvert} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Confirm Conversion</button>
               </div>
            </div>
         </Modal>
      </div>
   );
};

export default Leads;