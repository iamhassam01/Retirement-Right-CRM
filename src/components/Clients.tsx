import React, { useState, useEffect } from 'react';
import { clientService } from '../services/client.service';
import { Client } from '../types';
import {
   Search, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal,
   ShieldCheck, AlertTriangle, Loader2, ChevronLeft, ChevronRight,
   ChevronsLeft, ChevronsRight, Copy, Check, Phone, Mail,
   LayoutGrid, List, Upload
} from 'lucide-react';
import { useResponsiveView } from '../hooks/useMediaQuery';

interface ClientsProps {
   onSelectClient: (id: string) => void;
   onOpenImport?: () => void;
}

// Client Card Component for Mobile View
const ClientCard: React.FC<{
   client: Client;
   onSelect: (id: string) => void;
}> = ({ client, onSelect }) => {
   const [copied, setCopied] = useState(false);

   const copyClientId = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(client.clientId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   const primaryPhone = client.phones?.find(p => p.isPrimary)?.number || client.phones?.[0]?.number || client.phone;
   const primaryEmail = client.emails?.find(e => e.isPrimary)?.email || client.emails?.[0]?.email || client.email;

   return (
      <div
         onClick={() => onSelect(client.id)}
         className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer"
      >
         <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                  {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
               </div>
               <div>
                  <h3 className="font-semibold text-navy-900">{client.name}</h3>
                  <button
                     onClick={copyClientId}
                     className="flex items-center gap-1 text-xs text-slate-500 hover:text-teal-600 transition-colors mt-0.5"
                  >
                     <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{client.clientId}</span>
                     {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
               </div>
            </div>
            <MoreHorizontal size={18} className="text-slate-400" />
         </div>

         <div className="space-y-2 mb-3">
            {primaryPhone && (
               <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span>{primaryPhone}</span>
               </div>
            )}
            {primaryEmail && (
               <div className="flex items-center gap-2 text-sm text-slate-600 truncate">
                  <Mail size={14} className="text-slate-400" />
                  <span className="truncate">{primaryEmail}</span>
               </div>
            )}
         </div>

         <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
               client.status === 'Lead' ? 'bg-blue-50 text-blue-700' :
                  client.status === 'Prospect' ? 'bg-amber-50 text-amber-700' :
                     'bg-slate-100 text-slate-700'
               }`}>
               <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' :
                  client.status === 'Lead' ? 'bg-blue-500' :
                     client.status === 'Prospect' ? 'bg-amber-500' :
                        'bg-slate-500'
                  }`} />
               {client.status}
            </span>
            <span className="text-xs text-slate-400">
               {client.lastContact
                  ? new Date(client.lastContact).toLocaleDateString('en-US', {
                     month: 'short',
                     day: 'numeric'
                  })
                  : 'No contact'}
            </span>
         </div>
      </div>
   );
};

const Clients: React.FC<ClientsProps> = ({ onSelectClient, onOpenImport }) => {
   const [clients, setClients] = useState<Client[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterHealth, setFilterHealth] = useState<string>('all');
   const [filterRisk, setFilterRisk] = useState<string>('all');
   const [filterStatus, setFilterStatus] = useState<string>('all');
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);
   const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
   const [copiedId, setCopiedId] = useState<string | null>(null);

   const { isMobile, isTablet, isDesktop } = useResponsiveView();

   // Set default view based on screen size
   useEffect(() => {
      if (isMobile) {
         setViewMode('card');
      } else if (isDesktop) {
         setViewMode('table');
      }
   }, [isMobile, isDesktop]);

   useEffect(() => {
      const fetchClients = async () => {
         try {
            const data = await clientService.getAll();
            // Show all clients (Active + Churned)
            setClients(data.filter((c: Client) => c.status === 'Active' || c.status === 'Churned'));
         } catch (error) {
            console.error('Failed to fetch clients:', error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchClients();
   }, []);

   const filteredClients = clients.filter(c => {
      const search = searchTerm.toLowerCase();
      const primaryPhone = c.phones?.find(p => p.isPrimary)?.number || c.phones?.[0]?.number || c.phone;
      const primaryEmail = c.emails?.find(e => e.isPrimary)?.email || c.emails?.[0]?.email || c.email;

      const matchesSearch = (
         c.name.toLowerCase().includes(search) ||
         c.clientId?.toLowerCase().includes(search) ||
         primaryEmail?.toLowerCase().includes(search) ||
         primaryPhone?.toLowerCase().includes(search) ||
         c.status?.toLowerCase().includes(search) ||
         c.riskProfile?.toLowerCase().includes(search) ||
         c.tags?.some(tag => tag.toLowerCase().includes(search))
      );
      const matchesHealth = filterHealth === 'all' || c.portfolioHealth === filterHealth;
      const matchesRisk = filterRisk === 'all' || c.riskProfile === filterRisk;
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesHealth && matchesRisk && matchesStatus;
   });

   // Pagination calculations
   const totalPages = Math.ceil(filteredClients.length / pageSize);
   const startIndex = (currentPage - 1) * pageSize;
   const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize);

   // Reset to page 1 when filters change
   useEffect(() => {
      setCurrentPage(1);
   }, [searchTerm, filterHealth, filterRisk, filterStatus, pageSize]);

   // Calculate portfolio health percentage
   const calculatePortfolioHealth = (): string => {
      const clientsWithHealth = clients.filter(c => c.portfolioHealth);
      if (clientsWithHealth.length === 0) return 'N/A';

      const healthScores = clientsWithHealth.map(c => {
         if (c.portfolioHealth === 'On Track') return 100;
         if (c.portfolioHealth === 'Review Needed') return 70;
         return 40; // Rebalance
      });

      const avg = Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length);
      return `${avg}%`;
   };

   // Calculate at-risk (churned) clients
   const atRiskCount = clients.filter(c => c.status === 'Churned').length;

   const copyClientId = (clientId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(clientId);
      setCopiedId(clientId);
      setTimeout(() => setCopiedId(null), 2000);
   };

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   return (
      <div className="p-4 md:p-8 flex flex-col animate-fade-in">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 md:mb-8">
            <div>
               <h2 className="text-xl md:text-2xl font-bold text-navy-900">Client Roster</h2>
               <p className="text-slate-500 text-sm">Monitor portfolio health and relationship status.</p>
            </div>
            <div className="flex gap-3">
               {onOpenImport && (
                  <button
                     onClick={onOpenImport}
                     className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-teal-700 transition-colors"
                  >
                     <Upload size={16} />
                     <span className="hidden sm:inline">Import</span>
                  </button>
               )}
               <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">
                  Export Report
               </button>
            </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Total Clients</p>
                  <p className="text-xl md:text-2xl font-bold text-navy-900 mt-1">{clients.length}</p>
               </div>
               <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <ArrowUpRight size={20} />
               </div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Avg. Portfolio Health</p>
                  <p className="text-xl md:text-2xl font-bold text-teal-600 mt-1">{calculatePortfolioHealth()}</p>
               </div>
               <div className="h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                  <ShieldCheck size={20} />
               </div>
            </div>
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">At Risk (Churn)</p>
                  <p className="text-xl md:text-2xl font-bold text-amber-500 mt-1">{atRiskCount}</p>
               </div>
               <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                  <AlertTriangle size={20} />
               </div>
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            {/* Table Actions */}
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 md:justify-between md:items-center bg-slate-50/50">
               <div className="relative flex-1 max-w-full md:max-w-sm lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                     type="text"
                     placeholder="Search by name, ID, email, phone..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
               </div>
               <div className="flex flex-wrap gap-2 md:gap-3 items-center">
                  {/* View Toggle */}
                  <div className="flex bg-slate-100 rounded-lg p-1">
                     <button
                        onClick={() => setViewMode('card')}
                        className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Card View"
                     >
                        <LayoutGrid size={18} />
                     </button>
                     <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        title="Table View"
                     >
                        <List size={18} />
                     </button>
                  </div>

                  <select
                     value={filterHealth}
                     onChange={(e) => setFilterHealth(e.target.value)}
                     className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600"
                  >
                     <option value="all">All Health</option>
                     <option value="On Track">On Track</option>
                     <option value="Review Needed">Review Needed</option>
                     <option value="Rebalance">Rebalance</option>
                  </select>
                  <select
                     value={filterRisk}
                     onChange={(e) => setFilterRisk(e.target.value)}
                     className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hidden sm:block"
                  >
                     <option value="all">All Risk</option>
                     <option value="Conservative">Conservative</option>
                     <option value="Moderate">Moderate</option>
                     <option value="Aggressive">Aggressive</option>
                  </select>
                  <select
                     value={filterStatus}
                     onChange={(e) => setFilterStatus(e.target.value)}
                     className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600"
                  >
                     <option value="all">All Status</option>
                     <option value="Active">Active</option>
                     <option value="Churned">Churned</option>
                  </select>
               </div>
            </div>

            {/* Card View (Mobile Default) */}
            {viewMode === 'card' && (
               <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedClients.length === 0 ? (
                     <div className="col-span-full p-8 text-center text-slate-400">
                        <p className="text-sm">No clients found. Add your first client!</p>
                     </div>
                  ) : (
                     paginatedClients.map(client => (
                        <ClientCard
                           key={client.id}
                           client={client}
                           onSelect={onSelectClient}
                        />
                     ))
                  )}
               </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
               <>
                  {/* Table Header */}
                  <div className="overflow-x-auto">
                     <div className="min-w-[800px]">
                        <div className="grid grid-cols-12 bg-slate-50 p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky top-0">
                           <div className="col-span-1">ID</div>
                           <div className="col-span-2">Name</div>
                           <div className="col-span-2">Email</div>
                           <div className="col-span-2">Phone</div>
                           <div className="col-span-2">Status</div>
                           <div className="col-span-2">Last Contact</div>
                           <div className="col-span-1 text-right"></div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-slate-100">
                           {paginatedClients.length === 0 ? (
                              <div className="p-8 text-center text-slate-400">
                                 <p className="text-sm">No clients found. Add your first client!</p>
                              </div>
                           ) : (
                              paginatedClients.map(client => {
                                 const primaryPhone = client.phones?.find(p => p.isPrimary)?.number || client.phones?.[0]?.number || client.phone;
                                 const primaryEmail = client.emails?.find(e => e.isPrimary)?.email || client.emails?.[0]?.email || client.email;

                                 return (
                                    <div key={client.id} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors group">
                                       {/* Client ID */}
                                       <div className="col-span-1">
                                          <button
                                             onClick={(e) => copyClientId(client.clientId, e)}
                                             className="flex items-center gap-1 font-mono text-xs bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 px-1.5 py-0.5 rounded transition-colors"
                                             title="Click to copy"
                                          >
                                             {client.clientId}
                                             {copiedId === client.clientId ? (
                                                <Check size={10} className="text-emerald-500" />
                                             ) : (
                                                <Copy size={10} className="opacity-0 group-hover:opacity-100" />
                                             )}
                                          </button>
                                       </div>

                                       {/* Name */}
                                       <div className="col-span-2 flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                             {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                          </div>
                                          <button
                                             onClick={() => onSelectClient(client.id)}
                                             className="font-medium text-navy-900 hover:text-teal-600 text-sm truncate"
                                          >
                                             {client.name}
                                          </button>
                                       </div>

                                       {/* Email */}
                                       <div className="col-span-2">
                                          <span className="text-sm text-slate-600 truncate block">{primaryEmail || '-'}</span>
                                       </div>

                                       {/* Phone */}
                                       <div className="col-span-2">
                                          <span className="text-sm text-slate-600">{primaryPhone || '-'}</span>
                                       </div>

                                       {/* Status */}
                                       <div className="col-span-2">
                                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                             }`}>
                                             <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'
                                                }`} />
                                             {client.status}
                                          </span>
                                       </div>

                                       {/* Last Contact */}
                                       <div className="col-span-2">
                                          <p className="text-sm text-slate-600">
                                             {client.lastContact
                                                ? new Date(client.lastContact).toLocaleString('en-US', {
                                                   month: 'short',
                                                   day: 'numeric',
                                                   year: 'numeric'
                                                })
                                                : 'Never'}
                                          </p>
                                       </div>

                                       {/* Actions */}
                                       <div className="col-span-1 text-right">
                                          <button
                                             onClick={() => onSelectClient(client.id)}
                                             className="text-teal-600 hover:text-teal-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                             View
                                          </button>
                                       </div>
                                    </div>
                                 );
                              })
                           )}
                        </div>
                     </div>
                  </div>
               </>
            )}

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600">
                     Showing {filteredClients.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filteredClients.length)} of {filteredClients.length} clients
                  </span>
                  <select
                     value={pageSize}
                     onChange={(e) => setPageSize(Number(e.target.value))}
                     className="px-2 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600"
                  >
                     <option value={10}>10 per page</option>
                     <option value={25}>25 per page</option>
                     <option value={50}>50 per page</option>
                     <option value={100}>100 per page</option>
                  </select>
               </div>
               <div className="flex items-center gap-1">
                  <button
                     onClick={() => setCurrentPage(1)}
                     disabled={currentPage === 1}
                     className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronsLeft size={18} className="text-slate-600" />
                  </button>
                  <button
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                     className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronLeft size={18} className="text-slate-600" />
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600">
                     Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage >= totalPages}
                     className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronRight size={18} className="text-slate-600" />
                  </button>
                  <button
                     onClick={() => setCurrentPage(totalPages)}
                     disabled={currentPage >= totalPages}
                     className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronsRight size={18} className="text-slate-600" />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Clients;