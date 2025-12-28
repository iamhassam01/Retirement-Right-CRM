import React, { useState } from 'react';
import { MOCK_DOCS } from '../constants';
import { Folder, FileText, Download, MoreVertical, Search, UploadCloud } from 'lucide-react';
import Modal from './Modal';

const Documents: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in">
       <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-navy-900">Document Vault</h2>
           <p className="text-slate-500 text-sm">Secure storage for client contracts, reports, and compliance.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-navy-800"
        >
           <UploadCloud size={16} /> Upload File
        </button>
      </div>

      <div className="flex gap-6 h-full">
         {/* Sidebar - Folders */}
         <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 px-2">Folders</h3>
            <div className="space-y-1">
               {['All Documents', 'Client Contracts', 'Quarterly Reports', 'Compliance', 'Internal Assets', 'Templates'].map((folder, i) => (
                  <button key={folder} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${i === 0 ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                     <Folder size={18} className={i === 0 ? 'fill-teal-200 text-teal-600' : 'text-slate-400'} />
                     {folder}
                  </button>
               ))}
            </div>
         </div>

         {/* Main File Area */}
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
               <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="hover:text-navy-900 cursor-pointer">Documents</span>
                  <span>/</span>
                  <span className="font-medium text-navy-900">All Documents</span>
               </div>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Filter files..." className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0">
                     <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Name</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Category</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Date Modified</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">Size</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {MOCK_DOCS.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50 group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                    doc.type === 'pdf' ? 'bg-rose-50 text-rose-600' :
                                    doc.type === 'xls' ? 'bg-emerald-50 text-emerald-600' :
                                    doc.type === 'folder' ? 'bg-blue-50 text-blue-600' :
                                    'bg-slate-100 text-slate-600'
                                 }`}>
                                    {doc.type === 'folder' ? <Folder size={16} /> : <FileText size={16} />}
                                 </div>
                                 <span className="text-sm font-medium text-navy-900">{doc.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                 {doc.category}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-500">{doc.dateModified}</td>
                           <td className="px-6 py-4 text-sm text-slate-500">{doc.size}</td>
                           <td className="px-6 py-4 text-right">
                              <button className="p-1.5 text-slate-400 hover:text-navy-900 hover:bg-slate-200 rounded transition-colors">
                                 <Download size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document">
         <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex flex-col items-center justify-center text-slate-500 hover:border-teal-400 hover:bg-teal-50/10 transition-colors cursor-pointer">
               <UploadCloud size={32} className="mb-2 text-slate-400" />
               <p className="text-sm font-medium">Click to browse or drag file here</p>
               <p className="text-xs">PDF, DOCX, XLS up to 25MB</p>
            </div>
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">File Category</label>
               <select className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                  <option>Client Contract</option>
                  <option>Financial Report</option>
                  <option>Compliance Doc</option>
                  <option>Identification</option>
               </select>
            </div>
            <div className="pt-2 flex gap-3">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">Upload</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Documents;