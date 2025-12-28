import React, { useState } from 'react';
import { PipelineStage, Client } from '../types';
import { MOCK_CLIENTS } from '../constants';
import { ChevronRight, DollarSign, GripVertical, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

const Pipeline: React.FC = () => {
  // Initialize local state with mock data to allow mutation via Drag & Drop
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const stages = Object.values(PipelineStage);

  const getClientsInStage = (stage: PipelineStage) => {
    return clients.filter(c => c.pipelineStage === stage);
  };

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("clientId", clientId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData("clientId");
    
    if (clientId) {
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === clientId ? { ...client, pipelineStage: stage } : client
        )
      );
    }
  };

  const AddOpportunityForm = () => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const handleSave = () => {
      setStatus('saving');
      setTimeout(() => {
        setStatus('success');
        setTimeout(() => {
          setIsAddModalOpen(false);
          setStatus('idle');
          // In a real app, this would actually add to the list
        }, 1000);
      }, 1000);
    };

    if (status === 'success') {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 animate-in zoom-in">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-navy-900">Opportunity Added</h3>
          <p className="text-slate-500">The prospect has been added to the 'New Lead' stage.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">Prospect Name</label>
          <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. John Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1">Estimated AUM</label>
          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
             <input type="number" className="w-full pl-6 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="500,000" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Lead Source</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                 <option>Referral</option>
                 <option>Website</option>
                 <option>Event</option>
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-navy-900 mb-1">Risk Profile</label>
              <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                 <option>Conservative</option>
                 <option>Moderate</option>
                 <option>Aggressive</option>
              </select>
           </div>
        </div>
        <div className="pt-4 flex gap-3">
           <button onClick={() => setIsAddModalOpen(false)} disabled={status === 'saving'} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
           <button onClick={handleSave} disabled={status === 'saving'} className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
             {status === 'saving' ? 'Adding...' : 'Add Opportunity'}
           </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-hidden animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-navy-900">Prospect Pipeline</h2>
           <p className="text-slate-500 text-sm">Drag and drop cards to move prospects forward.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
              <p className="text-xs text-slate-400 font-medium uppercase">Potential AUM</p>
              <p className="text-lg font-bold text-navy-900">$5.2M</p>
           </div>
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors shadow-sm"
           >
              Add Opportunity
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max h-full">
           {stages.map((stage, index) => (
             <div 
                key={index} 
                className="w-72 flex flex-col h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage as PipelineStage)}
             >
               {/* Stage Header */}
               <div className={`
                 p-3 rounded-t-lg border-b-2 font-medium text-sm flex justify-between items-center transition-colors
                 ${index === 0 ? 'bg-slate-100 border-slate-300 text-slate-700' : ''}
                 ${index > 0 && index < stages.length - 1 ? 'bg-white border-teal-500 text-navy-900 shadow-sm' : ''}
                 ${index === stages.length - 1 ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : ''}
               `}>
                 <span>{stage}</span>
                 <span className="bg-slate-200/50 px-2 rounded-full text-xs">
                    {getClientsInStage(stage as PipelineStage).length}
                 </span>
               </div>
               
               {/* Drop Area */}
               <div className="flex-1 bg-slate-100/50 rounded-b-lg p-3 space-y-3 overflow-y-auto min-h-[500px] border border-t-0 border-slate-200/50">
                 {getClientsInStage(stage as PipelineStage).map(client => (
                   <div 
                      key={client.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-teal-300 transition-all group relative"
                   >
                     <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          client.riskProfile === 'Aggressive' ? 'bg-rose-50 text-rose-600' :
                          client.riskProfile === 'Conservative' ? 'bg-blue-50 text-blue-600' :
                          'bg-teal-50 text-teal-600'
                       }`}>
                         {client.riskProfile || 'N/A'}
                       </span>
                       <GripVertical size={14} className="text-slate-300" />
                     </div>
                     <h4 className="font-medium text-navy-900 mb-1">{client.name}</h4>
                     {client.aum && (
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                           <DollarSign size={12} /> {(client.aum / 1000).toFixed(0)}k est.
                        </p>
                     )}
                     <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] text-slate-400">Last: {client.lastContact}</span>
                        <div className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-[10px] font-bold">
                           SJ
                        </div>
                     </div>
                   </div>
                 ))}
                 
                 {/* Empty State visual */}
                 {getClientsInStage(stage as PipelineStage).length === 0 && (
                    <div className="h-32 flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                       <p className="text-xs font-medium">Drop here</p>
                    </div>
                 )}
               </div>
             </div>
           ))}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Pipeline Opportunity">
         <AddOpportunityForm />
      </Modal>
    </div>
  );
};

export default Pipeline;