import React, { useState, useEffect } from 'react';
import { clientService } from '../services/client.service';
import { Client } from '../types';
import { Search, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';

interface ClientsProps {
   onSelectClient: (id: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ onSelectClient }) => {
   const [clients, setClients] = useState<Client[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');

   useEffect(() => {
      const fetchClients = async () => {
         try {
            const data = await clientService.getAll();
            // Filter only Active clients
            setClients(data.filter((c: Client) => c.status === 'Active'));
         } catch (error) {
            console.error('Failed to fetch clients:', error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchClients();
   }, []);

   const filteredClients = clients.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
   );

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

   // Calculate at-risk clients
   const atRiskCount = clients.filter(c => c.portfolioHealth === 'Rebalance').length;

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   return (
      <div className="p-8 h-full flex flex-col animate-fade-in">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-2xl font-bold text-navy-900">Client Roster</h2>
               <p className="text-slate-500 text-sm">Monitor portfolio health and relationship status.</p>
            </div>
            <div className="flex gap-3">
               <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">
                  Export Report
               </button>
            </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Total Clients</p>
                  <p className="text-2xl font-bold text-navy-900 mt-1">{clients.length}</p>
               </div>
               <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <ArrowUpRight size={20} />
               </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Avg. Portfolio Health</p>
                  <p className="text-2xl font-bold text-teal-600 mt-1">{calculatePortfolioHealth()}</p>
               </div>
               <div className="h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                  <ShieldCheck size={20} />
               </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">At Risk (Churn)</p>
                  <p className="text-2xl font-bold text-amber-500 mt-1">{atRiskCount}</p>
               </div>
               <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                  <AlertTriangle size={20} />
               </div>
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
            {/* Table Actions */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
               <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                     type="text"
                     placeholder="Search clients..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
               </div>
               <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                     <Filter size={16} /> Filters
                  </button>
               </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 p-4 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
               <div className="col-span-3">Client Name</div>
               <div className="col-span-2">Email</div>
               <div className="col-span-2">Phone</div>
               <div className="col-span-2">Status</div>
               <div className="col-span-2">Last Contact</div>
               <div className="col-span-1 text-right"></div>
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
               {filteredClients.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                     <p className="text-sm">No clients found. Add your first client!</p>
                  </div>
               ) : (
                  filteredClients.map(client => (
                     <div key={client.id} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors group">
                        <div className="col-span-3 flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                              {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                           </div>
                           <div>
                              <button
                                 onClick={() => onSelectClient(client.id)}
                                 className="font-medium text-navy-900 hover:text-teal-600 text-sm block"
                              >
                                 {client.name}
                              </button>
                           </div>
                        </div>
                        <div className="col-span-2">
                           <span className="text-sm text-slate-600">{client.email || '-'}</span>
                        </div>
                        <div className="col-span-2">
                           <span className="text-sm text-slate-600">{client.phone || '-'}</span>
                        </div>
                        <div className="col-span-2">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                              }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                              {client.status}
                           </span>
                        </div>
                        <div className="col-span-2">
                           <p className="text-sm text-slate-600">
                              {client.lastContact ? new Date(client.lastContact).toLocaleDateString() : 'Never'}
                           </p>
                        </div>
                        <div className="col-span-1 text-right">
                           <button
                              onClick={() => onSelectClient(client.id)}
                              className="text-teal-600 hover:text-teal-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              View
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
   );
};

export default Clients;