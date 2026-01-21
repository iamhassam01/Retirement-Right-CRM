import React, { useState, useEffect, useRef } from 'react';
import { documentService, Document } from '../services/document.service';
import api from '../api/axios';
import { Folder, FileText, MoreVertical, Search, UploadCloud, Loader2, Trash2, Eye, X } from 'lucide-react';
import Modal from './Modal';

const Documents: React.FC = () => {
   const [documents, setDocuments] = useState<Document[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedCategory, setSelectedCategory] = useState<string>('All');
   const [searchTerm, setSearchTerm] = useState('');
   const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [uploadCategory, setUploadCategory] = useState('Client');
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [deleteModalOpen, setDeleteModalOpen] = useState(false);
   const [docToDelete, setDocToDelete] = useState<Document | null>(null);
   const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [isPreviewLoading, setIsPreviewLoading] = useState(false);

   const categories = ['All', 'Client', 'Compliance', 'Internal'];

   useEffect(() => {
      fetchDocuments();
   }, []);

   const fetchDocuments = async () => {
      try {
         setIsLoading(true);
         const data = await documentService.getAll();
         setDocuments(data);
      } catch (error) {
         console.error('Failed to fetch documents:', error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         setSelectedFile(e.target.files[0]);
      }
   };

   const handleUpload = async () => {
      if (!selectedFile) return;

      setUploadStatus('uploading');
      try {
         const newDoc = await documentService.upload(selectedFile, uploadCategory);
         setDocuments(prev => [newDoc, ...prev]);
         setUploadStatus('success');
         setTimeout(() => {
            setIsModalOpen(false);
            setUploadStatus('idle');
            setSelectedFile(null);
         }, 1500);
      } catch (error) {
         console.error('Upload failed:', error);
         setUploadStatus('error');
      }
   };

   const handleDownload = async (doc: Document) => {
      try {
         // Use authenticated API endpoint with filename from frontend
         await documentService.download(doc.id, doc.name);
      } catch (error) {
         console.error('Download failed:', error);
      }
   };

   const confirmDelete = async () => {
      if (!docToDelete) return;
      try {
         await documentService.delete(docToDelete.id);
         setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
      } catch (error) {
         console.error('Delete failed:', error);
      } finally {
         setDeleteModalOpen(false);
         setDocToDelete(null);
      }
   };

   const openDeleteModal = (doc: Document) => {
      setDocToDelete(doc);
      setDeleteModalOpen(true);
   };

   const isPreviewable = (doc: Document) => {
      const type = doc.type?.toLowerCase();
      return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(type || '');
   };

   const openPreview = (doc: Document) => {
      const token = localStorage.getItem('token');
      if (token) {
         setPreviewDoc(doc);
         // Include filename in URL path so Chrome PDF viewer uses it as the download name
         const encodedFilename = encodeURIComponent(doc.name);
         setPreviewUrl(`/api/documents/${doc.id}/download/${encodedFilename}?token=${token}&inline=true`);
         setIsPreviewLoading(false); // Direct load, let browser handle status
      }
   };

   const closePreview = () => {
      if (previewUrl) {
         window.URL.revokeObjectURL(previewUrl); // Clean up blob URL
      }
      setPreviewDoc(null);
      setPreviewUrl(null);
   };

   const filteredDocs = documents.filter(doc => {
      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
   });

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   return (
      <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col animate-fade-in">
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
               <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Document Vault</h2>
               <p className="text-slate-500 text-xs sm:text-sm">Secure storage for client contracts, reports, and compliance.</p>
            </div>
            <button
               onClick={() => setIsModalOpen(true)}
               className="flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-navy-800 active:bg-navy-700 min-h-[44px]"
            >
               <UploadCloud size={16} /> Upload File
            </button>
         </div>

         {/* Mobile Category Tabs */}
         <div className="lg:hidden flex overflow-x-auto gap-2 mb-4 pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((folder) => (
               <button
                  key={folder}
                  onClick={() => setSelectedCategory(folder)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${selectedCategory === folder ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600 active:bg-slate-200'}`}
               >
                  <Folder size={16} className={selectedCategory === folder ? 'fill-teal-200 text-teal-600' : 'text-slate-400'} />
                  {folder === 'All' ? 'All' : folder}
               </button>
            ))}
         </div>

         <div className="flex gap-6 flex-1 min-h-0">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden lg:block w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-full">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4 px-2">Folders</h3>
               <div className="space-y-1">
                  {categories.map((folder, i) => (
                     <button
                        key={folder}
                        onClick={() => setSelectedCategory(folder)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${selectedCategory === folder ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                     >
                        <Folder size={18} className={selectedCategory === folder ? 'fill-teal-200 text-teal-600' : 'text-slate-400'} />
                        {folder === 'All' ? 'All Documents' : folder}
                     </button>
                  ))}
               </div>
            </div>

            {/* Main File Area */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-w-0">
               <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
                     <span className="hover:text-navy-900 cursor-pointer">Documents</span>
                     <span>/</span>
                     <span className="font-medium text-navy-900">{selectedCategory === 'All' ? 'All Documents' : selectedCategory}</span>
                  </div>
                  <div className="relative w-full sm:w-auto">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input
                        type="text"
                        placeholder="Filter files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                     />
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto">
                  {filteredDocs.length > 0 ? (
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
                           {filteredDocs.map(doc => (
                              <tr key={doc.id} className="hover:bg-slate-50 group">
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded flex items-center justify-center ${doc.type === 'pdf' ? 'bg-rose-50 text-rose-600' :
                                          doc.type === 'xls' || doc.type === 'xlsx' ? 'bg-emerald-50 text-emerald-600' :
                                             doc.type === 'doc' || doc.type === 'docx' ? 'bg-blue-50 text-blue-600' :
                                                'bg-slate-100 text-slate-600'
                                          }`}>
                                          <FileText size={16} />
                                       </div>
                                       <span className="text-sm font-medium text-navy-900">{doc.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                       {doc.category || 'Uncategorized'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(doc.updatedAt).toLocaleDateString()}
                                 </td>
                                 <td className="px-6 py-4 text-sm text-slate-500">{doc.size || '-'}</td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                       {isPreviewable(doc) && (
                                          <button
                                             onClick={() => openPreview(doc)}
                                             title="Preview"
                                             className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                          >
                                             <Eye size={16} />
                                          </button>
                                       )}

                                       <button
                                          onClick={() => openDeleteModal(doc)}
                                          title="Delete"
                                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                       >
                                          <Trash2 size={16} />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <FileText size={48} className="mb-4" />
                        <p className="text-lg font-medium text-navy-900">No documents yet</p>
                        <p className="text-sm">Upload your first document to get started</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Document">
            <div className="space-y-4">
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
               />
               <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex flex-col items-center justify-center text-slate-500 hover:border-teal-400 hover:bg-teal-50/10 transition-colors cursor-pointer"
               >
                  {selectedFile ? (
                     <>
                        <FileText size={32} className="mb-2 text-teal-600" />
                        <p className="text-sm font-medium text-navy-900">{selectedFile.name}</p>
                        <p className="text-xs">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                     </>
                  ) : (
                     <>
                        <UploadCloud size={32} className="mb-2 text-slate-400" />
                        <p className="text-sm font-medium">Click to browse or drag file here</p>
                        <p className="text-xs">PDF, DOCX, XLS up to 25MB</p>
                     </>
                  )}
               </div>
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">File Category</label>
                  <select
                     value={uploadCategory}
                     onChange={(e) => setUploadCategory(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                     <option value="Client">Client</option>
                     <option value="Compliance">Compliance</option>
                     <option value="Internal">Internal</option>
                  </select>
               </div>
               <div className="pt-2 flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                  <button
                     onClick={handleUpload}
                     disabled={!selectedFile || uploadStatus === 'uploading'}
                     className="flex-1 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                     {uploadStatus === 'uploading' ? (
                        <>
                           <Loader2 className="animate-spin" size={16} />
                           Uploading...
                        </>
                     ) : uploadStatus === 'success' ? (
                        'Uploaded!'
                     ) : (
                        'Upload'
                     )}
                  </button>
               </div>
            </div>
         </Modal>

         {/* Delete Confirmation Modal */}
         <Modal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDocToDelete(null); }} title="Delete Document">
            <div className="space-y-4">
               <p className="text-sm text-slate-600">
                  Are you sure you want to delete <span className="font-medium text-navy-900">{docToDelete?.name}</span>? This action cannot be undone.
               </p>
               <div className="pt-2 flex gap-3">
                  <button
                     onClick={() => { setDeleteModalOpen(false); setDocToDelete(null); }}
                     className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                  >
                     Cancel
                  </button>
                  <button
                     onClick={confirmDelete}
                     className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                     Delete
                  </button>
               </div>
            </div>
         </Modal>

         {/* Preview Modal */}
         {previewDoc && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-8">
               <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                     <h3 className="text-lg font-semibold text-navy-900">{previewDoc.name}</h3>
                     <button
                        onClick={closePreview}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                     >
                        <X size={20} />
                     </button>
                  </div>
                  <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[400px]">
                     {isPreviewLoading ? (
                        <div className="flex flex-col items-center gap-3">
                           <Loader2 className="animate-spin text-teal-600" size={32} />
                           <p className="text-sm text-slate-500">Loading preview...</p>
                        </div>
                     ) : previewUrl ? (
                        previewDoc.type?.toLowerCase() === 'pdf' ? (
                           <iframe
                              src={`${previewUrl}#toolbar=0`}
                              className="w-full h-[70vh] border-0 rounded-lg bg-white"
                              title={previewDoc.name}
                           />
                        ) : (
                           <img
                              src={previewUrl}
                              alt={previewDoc.name}
                              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                           />
                        )
                     ) : (
                        <p className="text-sm text-slate-500">Failed to load preview</p>
                     )}
                  </div>

               </div>
            </div>
         )}
      </div>
   );
};

export default Documents;