import React, { useState, useEffect } from 'react';
import { clientService } from '../services/client.service';
import { Client } from '../types';
import { Search, Filter, Mail, ArrowRight, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, Phone } from 'lucide-react';
import Modal from './Modal';
import { useResponsiveView } from '../hooks/useMediaQuery';

interface LeadsProps {
   onSelectClient: (id: string) => void;
}

const Leads: React.FC<LeadsProps> = ({ onSelectClient }) => {
   const [convertModalOpen, setConvertModalOpen] = useState(false);
   const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<string | null>(null);
   const [leads, setLeads] = useState<Client[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterStatus, setFilterStatus] = useState<string>('all');
   const [filterStage, setFilterStage] = useState<string>('all');
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);
   const [sortField, setSortField] = useState<'name' | 'status' | 'lastContact'>('name');
   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
   const { isMobile, isTablet } = useResponsiveView();

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

   const filteredLeads = leads.filter(l => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
         l.name.toLowerCase().includes(search) ||
         l.email?.toLowerCase().includes(search) ||
         l.phone?.toLowerCase().includes(search) ||
         l.status?.toLowerCase().includes(search) ||
         l.pipelineStage?.toLowerCase().includes(search) ||
         l.tags?.some(tag => tag.toLowerCase().includes(search))
      );
      const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
      const matchesStage = filterStage === 'all' || l.pipelineStage === filterStage;
      return matchesSearch && matchesStatus && matchesStage;
   }).sort((a, b) => {
      if (sortField === 'lastContact') {
         const aDate = new Date(a.lastContact || 0).getTime();
         const bDate = new Date(b.lastContact || 0).getTime();
         return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      }

      const aValue = sortField === 'name' ? a.name : (a.status || '');
      const bValue = sortField === 'name' ? b.name : (b.status || '');

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
   });

   const handleSort = (field: 'name' | 'status' | 'lastContact') => {
      if (sortField === field) {
         setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
         setSortField(field);
         setSortDirection('asc');
      }
   };

   // ... existing code ...

   // Update Header in Table View inside return statement (need to verify line numbers for this replace, better to split if large gap)
   // Splitting replacement for safety. This block handles filter logic + sort function + handleSort definition.

   // Pagination calculations
   const totalPages = Math.ceil(filteredLeads.length / pageSize);
   const startIndex = (currentPage - 1) * pageSize;
   const paginatedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

   // Reset to page 1 when filters change
   useEffect(() => {
      setCurrentPage(1);
   }, [searchTerm, filterStatus, filterStage, pageSize]);

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col">
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
            <div>
               <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Leads Management</h2>
               <p className="text-slate-500 text-sm">Review incoming inquiries and active prospects.</p>
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            {/* Table Actions */}
            <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center bg-slate-50/50">
               <div className="relative flex-1 sm:max-w-sm lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                     type="text"
                     placeholder="Search by name, source, or tag..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
               </div>
               <div className="flex gap-2 sm:gap-3 overflow-x-auto">
                  <select
                     value={filterStatus}
                     onChange={(e) => setFilterStatus(e.target.value)}
                     className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 min-w-[100px]"
                  >
                     <option value="all">All Status</option>
                     <option value="Lead">Lead</option>
                     <option value="Prospect">Prospect</option>
                  </select>
                  <select
                     value={filterStage}
                     onChange={(e) => setFilterStage(e.target.value)}
                     className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 min-w-[100px] hidden sm:block"
                  >
                     <option value="all">All Stages</option>
                     <option value="New Lead">New Lead</option>
                     <option value="Contacted">Contacted</option>
                     <option value="Appointment Booked">Appointment Booked</option>
                     <option value="Attended">Attended</option>
                     <option value="Proposal">Proposal</option>
                  </select>
               </div>
            </div>

            {/* Mobile: Card View */}
            {isMobile ? (
               <div className="p-3 space-y-3">
                  {paginatedLeads.length === 0 ? (
                     <div className="p-8 text-center text-slate-400">
                        <p className="text-sm">No leads found. Add your first lead!</p>
                     </div>
                  ) : (
                     paginatedLeads.map(lead => (
                        <div
                           key={lead.id}
                           onClick={() => onSelectClient(lead.id)}
                           className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-teal-200 active:bg-slate-50 transition-all cursor-pointer"
                        >
                           <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {lead.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                 </div>
                                 <div className="min-w-0">
                                    <h3 className="font-semibold text-navy-900 truncate">{lead.name}</h3>
                                    <p className="text-xs text-slate-500 truncate">{lead.email || 'No email'}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center justify-between mb-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lead.status === 'Prospect' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>
                                 {lead.status}
                              </span>
                              {lead.phone && (
                                 <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Phone size={12} /> {lead.phone}
                                 </span>
                              )}
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-400">
                                 {lead.lastContact
                                    ? new Date(lead.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : 'Never contacted'}
                              </span>
                              <button
                                 onClick={(e) => handleConvertClick(e, lead.id)}
                                 className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200 rounded-lg transition-colors min-h-[36px]"
                              >
                                 <ArrowRight size={14} /> Convert
                              </button>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            ) : (
               /* Desktop: Table View */
               <>
                  {/* Table Header */}
                  <div className="grid grid-cols-12 bg-slate-50 p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                     <div
                        className="col-span-4 cursor-pointer hover:text-navy-900 flex items-center gap-1"
                        onClick={() => handleSort('name')}
                     >
                        Name & Contact {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                     </div>
                     <div
                        className="col-span-2 cursor-pointer hover:text-navy-900 flex items-center gap-1"
                        onClick={() => handleSort('status')}
                     >
                        Status {sortField === 'status' && (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                     </div>
                     <div className="col-span-3">Phone</div>
                     <div
                        className="col-span-2 cursor-pointer hover:text-navy-900 flex items-center gap-1"
                        onClick={() => handleSort('lastContact')}
                     >
                        Last Contact {sortField === 'lastContact' && (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                     </div>
                     <div className="col-span-1 text-right">Actions</div>
                  </div>

                  {/* Table Body */}
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                     {paginatedLeads.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                           <p className="text-sm">No leads found. Add your first lead!</p>
                        </div>
                     ) : (
                        paginatedLeads.map(lead => (
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
                                    {lead.lastContact
                                       ? new Date(lead.lastContact).toLocaleString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit'
                                       })
                                       : 'Never'}
                                 </p>
                              </div>
                              <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button
                                    title="Convert to Client"
                                    onClick={(e) => handleConvertClick(e, lead.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                                 >
                                    <ArrowRight size={14} />
                                    Convert
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </>)}

            {/* Pagination Controls */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
               <div className="flex items-center gap-2 sm:gap-4 text-sm">
                  <span className="text-slate-600 text-xs sm:text-sm">
                     {filteredLeads.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filteredLeads.length)} of {filteredLeads.length}
                  </span>
                  <select
                     value={pageSize}
                     onChange={(e) => setPageSize(Number(e.target.value))}
                     className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs sm:text-sm text-slate-600"
                  >
                     <option value={10}>10</option>
                     <option value={25}>25</option>
                     <option value={50}>50</option>
                  </select>
               </div>
               <div className="flex items-center gap-1">
                  <button
                     onClick={() => setCurrentPage(1)}
                     disabled={currentPage === 1}
                     className="p-2 rounded hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                     <ChevronsLeft size={18} className="text-slate-600" />
                  </button>
                  <button
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-2 rounded hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                     <ChevronLeft size={18} className="text-slate-600" />
                  </button>
                  <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-slate-600">
                     {currentPage}/{totalPages || 1}
                  </span>
                  <button
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage >= totalPages}
                     className="p-2 rounded hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                     <ChevronRight size={18} className="text-slate-600" />
                  </button>
                  <button
                     onClick={() => setCurrentPage(totalPages)}
                     disabled={currentPage >= totalPages}
                     className="p-2 rounded hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                     <ChevronsRight size={18} className="text-slate-600" />
                  </button>
               </div>
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