import React from 'react';
import { MOCK_CLIENTS } from '../constants';
import { Search, Filter, ArrowUpRight, ArrowDownRight, MoreHorizontal, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ClientsProps {
  onSelectClient: (id: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ onSelectClient }) => {
  const clients = MOCK_CLIENTS.filter(c => c.status === 'Active');

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
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Total AUM</p>
              <p className="text-2xl font-bold text-navy-900 mt-1">$42.5M</p>
           </div>
           <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
              <ArrowUpRight size={20} />
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Avg. Portfolio Health</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">94%</p>
           </div>
           <div className="h-10 w-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
              <ShieldCheck size={20} />
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">At Risk (Churn)</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">1 Client</p>
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
            <div className="col-span-2">AUM</div>
            <div className="col-span-2">Portfolio Status</div>
            <div className="col-span-2">Last Contact</div>
            <div className="col-span-2">Next Review</div>
            <div className="col-span-1 text-right"></div>
         </div>

         {/* Table Body */}
         <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {clients.map(client => (
               <div key={client.id} className="grid grid-cols-12 p-4 items-center hover:bg-slate-50 transition-colors group">
                  <div className="col-span-3 flex items-center gap-3">
                     <img src={client.imageUrl} className="w-9 h-9 rounded-full object-cover" alt="" />
                     <div>
                        <button 
                          onClick={() => onSelectClient(client.id)}
                          className="font-medium text-navy-900 hover:text-teal-600 text-sm block"
                        >
                           {client.name}
                        </button>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                           {client.riskProfile}
                        </span>
                     </div>
                  </div>
                  <div className="col-span-2">
                     <span className="text-sm font-medium text-navy-900">${(client.aum || 0).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        client.portfolioHealth === 'On Track' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                     }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${client.portfolioHealth === 'On Track' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {client.portfolioHealth || 'On Track'}
                     </span>
                  </div>
                  <div className="col-span-2">
                     <p className="text-sm text-slate-600">{client.lastContact}</p>
                  </div>
                  <div className="col-span-2">
                     <p className="text-sm text-slate-600">Nov 15, 2023</p>
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
            ))}
         </div>
      </div>
    </div>
  );
};

export default Clients;