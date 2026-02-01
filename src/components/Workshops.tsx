import React, { useState, useEffect, useCallback } from 'react';
import {
   Calendar, MapPin, Users, Edit2, Plus, Trash2, RefreshCw,
   CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp,
   Globe, FileText, HelpCircle, User, ExternalLink, Loader2, X
} from 'lucide-react';
import Modal from './Modal';
import {
   EventTemplate, EventOccurrence, FAQ, CreateEventTemplateInput, CreateOccurrenceInput, WPStatus
} from '../types';
import * as eventService from '../services/eventTemplate.service';

// ========== MAIN COMPONENT ==========
const Workshops: React.FC = () => {
   const [templates, setTemplates] = useState<EventTemplate[]>([]);
   const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
   const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
   const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
   const [editingOccurrence, setEditingOccurrence] = useState<EventOccurrence | null>(null);
   const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
   const [isSyncing, setIsSyncing] = useState<string | null>(null);

   const fetchTemplates = useCallback(async () => {
      try {
         setIsLoading(true);
         const data = await eventService.getEventTemplates();
         setTemplates(data);
      } catch (error) {
         console.error('Failed to fetch templates:', error);
      } finally {
         setIsLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchTemplates();
   }, [fetchTemplates]);

   const handleCreateTemplate = () => {
      setEditingTemplate(null);
      setIsTemplateModalOpen(true);
   };

   const handleEditTemplate = (template: EventTemplate) => {
      setEditingTemplate(template);
      setIsTemplateModalOpen(true);
   };

   const handleDeleteTemplate = async (id: string) => {
      if (!confirm('Delete this template and ALL its occurrences? This will also remove them from WordPress.')) return;
      try {
         await eventService.deleteEventTemplate(id);
         setTemplates(prev => prev.filter(t => t.id !== id));
         if (selectedTemplate?.id === id) setSelectedTemplate(null);
      } catch (error) {
         console.error('Failed to delete template:', error);
         alert('Failed to delete template');
      }
   };

   const handleAddOccurrence = (template: EventTemplate) => {
      setSelectedTemplate(template);
      setEditingOccurrence(null);
      setIsOccurrenceModalOpen(true);
   };

   const handleEditOccurrence = (occ: EventOccurrence, template: EventTemplate) => {
      setSelectedTemplate(template);
      setEditingOccurrence(occ);
      setIsOccurrenceModalOpen(true);
   };

   const handleDeleteOccurrence = async (occId: string) => {
      if (!confirm('Delete this occurrence? It will also be removed from WordPress.')) return;
      try {
         await eventService.deleteOccurrence(occId);
         fetchTemplates();
      } catch (error) {
         console.error('Failed to delete occurrence:', error);
      }
   };

   const handleSyncAll = async (templateId: string, status: WPStatus) => {
      setIsSyncing(templateId);
      try {
         const result = await eventService.syncTemplateToWordPress(templateId, status);
         if (result.success) {
            alert(`Successfully synced ${result.synced} occurrences!`);
         } else {
            alert(`Synced ${result.synced || 0} of ${result.total || 0}. ${result.failed || 0} failed.`);
         }
         fetchTemplates();
      } catch (error) {
         console.error('Sync failed:', error);
         alert('Sync failed. Check WordPress credentials.');
      } finally {
         setIsSyncing(null);
      }
   };

   const handleSyncOccurrence = async (occId: string, status: WPStatus) => {
      setIsSyncing(occId);
      try {
         const result = await eventService.syncOccurrence(occId, status);
         if (result.success) {
            alert('Synced successfully!');
         } else {
            alert(`Sync failed: ${result.error}`);
         }
         fetchTemplates();
      } catch (error) {
         console.error('Sync failed:', error);
      } finally {
         setIsSyncing(null);
      }
   };

   const toggleExpanded = (id: string) => {
      setExpandedTemplateId(prev => prev === id ? null : id);
   };

   if (isLoading) {
      return (
         <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-navy-900" size={32} />
         </div>
      );
   }

   return (
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
               <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Event Templates</h2>
               <p className="text-slate-500 text-xs sm:text-sm">Manage workshop templates and their occurrences with WordPress sync.</p>
            </div>
            <button
               onClick={handleCreateTemplate}
               className="px-4 sm:px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 shadow-md flex items-center gap-2"
            >
               <Plus size={18} /> New Template
            </button>
         </div>

         {/* Templates List */}
         {templates.length > 0 ? (
            <div className="space-y-4">
               {templates.map((template) => (
                  <TemplateCard
                     key={template.id}
                     template={template}
                     isExpanded={expandedTemplateId === template.id}
                     isSyncing={isSyncing}
                     onToggle={() => toggleExpanded(template.id)}
                     onEdit={() => handleEditTemplate(template)}
                     onDelete={() => handleDeleteTemplate(template.id)}
                     onAddOccurrence={() => handleAddOccurrence(template)}
                     onEditOccurrence={(occ) => handleEditOccurrence(occ, template)}
                     onDeleteOccurrence={handleDeleteOccurrence}
                     onSyncAll={(status) => handleSyncAll(template.id, status)}
                     onSyncOccurrence={handleSyncOccurrence}
                  />
               ))}
            </div>
         ) : (
            <EmptyState onCreateTemplate={handleCreateTemplate} />
         )}

         {/* Template Modal */}
         <Modal
            isOpen={isTemplateModalOpen}
            onClose={() => setIsTemplateModalOpen(false)}
            title={editingTemplate ? 'Edit Template' : 'Create Event Template'}
            size="lg"
         >
            <TemplateForm
               template={editingTemplate}
               onClose={() => setIsTemplateModalOpen(false)}
               onSuccess={() => {
                  setIsTemplateModalOpen(false);
                  fetchTemplates();
               }}
            />
         </Modal>

         {/* Occurrence Modal */}
         <Modal
            isOpen={isOccurrenceModalOpen}
            onClose={() => setIsOccurrenceModalOpen(false)}
            title={editingOccurrence ? 'Edit Occurrence' : 'Add New Occurrence'}
         >
            {selectedTemplate && (
               <OccurrenceForm
                  templateId={selectedTemplate.id}
                  occurrence={editingOccurrence}
                  onClose={() => setIsOccurrenceModalOpen(false)}
                  onSuccess={() => {
                     setIsOccurrenceModalOpen(false);
                     fetchTemplates();
                  }}
               />
            )}
         </Modal>
      </div>
   );
};

// ========== TEMPLATE CARD COMPONENT ==========
interface TemplateCardProps {
   template: EventTemplate;
   isExpanded: boolean;
   isSyncing: string | null;
   onToggle: () => void;
   onEdit: () => void;
   onDelete: () => void;
   onAddOccurrence: () => void;
   onEditOccurrence: (occ: EventOccurrence) => void;
   onDeleteOccurrence: (id: string) => void;
   onSyncAll: (status: WPStatus) => void;
   onSyncOccurrence: (id: string, status: WPStatus) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
   template, isExpanded, isSyncing, onToggle, onEdit, onDelete,
   onAddOccurrence, onEditOccurrence, onDeleteOccurrence, onSyncAll, onSyncOccurrence
}) => {
   const occurrences = template.occurrences || [];
   const upcomingOccurrences = occurrences.filter(o =>
      new Date(o.eventDate) >= new Date() && o.status === 'scheduled'
   );
   const syncedCount = occurrences.filter(o => o.wpSyncStatus === 'synced').length;

   return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         {/* Header */}
         <div
            className="p-4 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={onToggle}
         >
            <div className="flex items-start justify-between gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                     <h3 className="text-lg font-bold text-navy-900 truncate">{template.name}</h3>
                     {!template.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">Inactive</span>
                     )}
                  </div>
                  {template.subtitle && (
                     <p className="text-sm text-slate-500 truncate">{template.subtitle}</p>
                  )}
               </div>
               <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center hidden sm:block">
                     <p className="text-2xl font-bold text-navy-900">{upcomingOccurrences.length}</p>
                     <p className="text-xs text-slate-500">Upcoming</p>
                  </div>
                  <div className="text-center hidden sm:block">
                     <p className="text-2xl font-bold text-teal-600">{syncedCount}</p>
                     <p className="text-xs text-slate-500">Synced</p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
               </div>
            </div>

            {/* Quick Stats (Mobile) */}
            <div className="flex gap-4 mt-3 sm:hidden">
               <span className="text-sm"><strong>{upcomingOccurrences.length}</strong> upcoming</span>
               <span className="text-sm text-teal-600"><strong>{syncedCount}</strong> synced</span>
            </div>
         </div>

         {/* Expanded Content */}
         {isExpanded && (
            <div className="border-t border-slate-100">
               {/* Actions */}
               <div className="p-4 bg-slate-50 flex flex-wrap gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
                     className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1">
                     <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onAddOccurrence(); }}
                     className="px-3 py-1.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-1">
                     <Plus size={14} /> Add Date
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onSyncAll('draft'); }}
                     disabled={isSyncing === template.id}
                     className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-200 flex items-center gap-1 disabled:opacity-50">
                     {isSyncing === template.id ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                     Sync as Draft
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onSyncAll('publish'); }}
                     disabled={isSyncing === template.id}
                     className="px-3 py-1.5 text-sm bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 flex items-center gap-1 disabled:opacity-50">
                     {isSyncing === template.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                     Sync & Publish
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                     className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 ml-auto">
                     <Trash2 size={14} /> Delete
                  </button>
               </div>

               {/* Occurrences */}
               <div className="p-4">
                  <h4 className="text-sm font-semibold text-navy-900 mb-3">Occurrences ({occurrences.length})</h4>
                  {occurrences.length > 0 ? (
                     <div className="space-y-2">
                        {occurrences.map((occ) => (
                           <OccurrenceRow
                              key={occ.id}
                              occurrence={occ}
                              isSyncing={isSyncing === occ.id}
                              onEdit={() => onEditOccurrence(occ)}
                              onDelete={() => onDeleteOccurrence(occ.id)}
                              onSync={(status) => onSyncOccurrence(occ.id, status)}
                           />
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-8 bg-slate-50 rounded-lg">
                        <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-sm text-slate-500">No occurrences yet</p>
                        <button onClick={onAddOccurrence}
                           className="mt-2 text-sm text-teal-600 hover:underline">
                           + Add first occurrence
                        </button>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

// ========== OCCURRENCE ROW COMPONENT ==========
interface OccurrenceRowProps {
   occurrence: EventOccurrence;
   isSyncing: boolean;
   onEdit: () => void;
   onDelete: () => void;
   onSync: (status: WPStatus) => void;
}

const OccurrenceRow: React.FC<OccurrenceRowProps> = ({ occurrence, isSyncing, onEdit, onDelete, onSync }) => {
   const date = new Date(occurrence.eventDate);
   const isPast = date < new Date();
   const syncStatus = occurrence.wpSyncStatus || 'pending';

   const getSyncBadge = () => {
      const colors = eventService.getSyncStatusColor(syncStatus);
      return (
         <span className={`px-2 py-0.5 text-xs rounded-full ${colors}`}>
            {eventService.getSyncStatusLabel(syncStatus)}
         </span>
      );
   };

   return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${isPast ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
         {/* Date */}
         <div className="w-14 h-14 bg-navy-900 text-white rounded-lg flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
            <span className="text-xl font-bold">{date.getDate()}</span>
         </div>

         {/* Details */}
         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
               <span className="font-medium text-navy-900">{occurrence.startTime || 'TBD'}</span>
               {occurrence.room && <span className="text-slate-500">• {occurrence.room}</span>}
               {getSyncBadge()}
            </div>
            <p className="text-sm text-slate-500 truncate flex items-center gap-1">
               <MapPin size={12} /> {occurrence.venueName}, {occurrence.city}
            </p>
         </div>

         {/* Actions */}
         <div className="flex items-center gap-1 flex-shrink-0">
            {syncStatus !== 'synced' && (
               <button onClick={() => onSync('publish')} disabled={isSyncing}
                  className="p-2 text-green-600 hover:bg-green-50 rounded" title="Sync & Publish">
                  {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
               </button>
            )}
            {occurrence.wpPostId && (
               <a href={`https://retirement-right.com/event/${occurrence.wpSlug || occurrence.wpPostId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View on WordPress">
                  <ExternalLink size={16} />
               </a>
            )}
            <button onClick={onEdit} className="p-2 text-slate-500 hover:bg-slate-100 rounded" title="Edit">
               <Edit2 size={16} />
            </button>
            <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Delete">
               <Trash2 size={16} />
            </button>
         </div>
      </div>
   );
};

// ========== EMPTY STATE ==========
const EmptyState: React.FC<{ onCreateTemplate: () => void }> = ({ onCreateTemplate }) => (
   <div className="text-center py-24 bg-white rounded-xl border border-slate-200">
      <FileText size={64} className="mx-auto mb-4 text-slate-300" />
      <h3 className="text-xl font-bold text-navy-900 mb-2">No Event Templates Yet</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">
         Create an event template to manage recurring workshops. Each template can have multiple dates/locations.
      </p>
      <button onClick={onCreateTemplate}
         className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
         + Create Your First Template
      </button>
   </div>
);

// ========== TEMPLATE FORM ==========
interface TemplateFormProps {
   template: EventTemplate | null;
   onClose: () => void;
   onSuccess: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onClose, onSuccess }) => {
   const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'host' | 'advanced'>('basic');
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Form state
   const [name, setName] = useState(template?.name || '');
   const [subtitle, setSubtitle] = useState(template?.subtitle || '');
   const [description, setDescription] = useState(template?.description || '');
   const [learnings, setLearnings] = useState<string[]>(template?.learnings || ['']);
   const [whyAttend, setWhyAttend] = useState(template?.whyAttend || '');
   const [faqs, setFaqs] = useState<FAQ[]>(template?.faqs || [{ question: '', answer: '' }]);
   const [hostName, setHostName] = useState(template?.hostName || '');
   const [hostTitle, setHostTitle] = useState(template?.hostTitle || '');
   const [hostEmail, setHostEmail] = useState(template?.hostEmail || '');
   const [hostPhone, setHostPhone] = useState(template?.hostPhone || '');
   const [guideUrl, setGuideUrl] = useState(template?.guideUrl || '');
   const [disclaimer, setDisclaimer] = useState(template?.disclaimer || '');

   const handleSubmit = async () => {
      if (!name.trim()) {
         alert('Template name is required');
         return;
      }
      setIsSubmitting(true);
      try {
         const data: CreateEventTemplateInput = {
            name: name.trim(),
            subtitle: subtitle.trim() || undefined,
            description: description.trim() || undefined,
            learnings: learnings.filter(l => l.trim()),
            whyAttend: whyAttend.trim() || undefined,
            faqs: faqs.filter(f => f.question.trim() && f.answer.trim()),
            hostName: hostName.trim() || undefined,
            hostTitle: hostTitle.trim() || undefined,
            hostEmail: hostEmail.trim() || undefined,
            hostPhone: hostPhone.trim() || undefined,
            guideUrl: guideUrl.trim() || undefined,
            disclaimer: disclaimer.trim() || undefined,
         };

         if (template) {
            await eventService.updateEventTemplate(template.id, data);
         } else {
            await eventService.createEventTemplate(data);
         }
         onSuccess();
      } catch (error) {
         console.error('Failed to save template:', error);
         alert('Failed to save template');
      } finally {
         setIsSubmitting(false);
      }
   };

   const addLearning = () => setLearnings([...learnings, '']);
   const removeLearning = (index: number) => setLearnings(learnings.filter((_, i) => i !== index));
   const updateLearning = (index: number, value: string) => {
      const updated = [...learnings];
      updated[index] = value;
      setLearnings(updated);
   };

   const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
   const removeFaq = (index: number) => setFaqs(faqs.filter((_, i) => i !== index));
   const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
      const updated = [...faqs];
      updated[index][field] = value;
      setFaqs(updated);
   };

   const tabs = [
      { id: 'basic' as const, label: 'Basic Info', icon: FileText },
      { id: 'content' as const, label: 'Content', icon: HelpCircle },
      { id: 'host' as const, label: 'Host', icon: User },
      { id: 'advanced' as const, label: 'Advanced', icon: Clock },
   ];

   return (
      <div className="max-h-[70vh] overflow-y-auto">
         {/* Tabs */}
         <div className="flex border-b border-slate-200 mb-4 overflow-x-auto">
            {tabs.map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                     ? 'border-teal-500 text-teal-600'
                     : 'border-transparent text-slate-500 hover:text-slate-700'
                     }`}
               >
                  <tab.icon size={16} /> {tab.label}
               </button>
            ))}
         </div>

         {/* Basic Tab */}
         {activeTab === 'basic' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Template Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                     placeholder="e.g. Maximizing Social Security" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Subtitle</label>
                  <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                     placeholder="e.g. Maximize Your Benefits" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Short Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                     rows={3} placeholder="Brief description for event listings..." />
               </div>
            </div>
         )}

         {/* Content Tab */}
         {activeTab === 'content' && (
            <div className="space-y-6">
               {/* Learnings */}
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">What You'll Learn</label>
                  <div className="space-y-2">
                     {learnings.map((learning, idx) => (
                        <div key={idx} className="flex gap-2">
                           <input type="text" value={learning} onChange={(e) => updateLearning(idx, e.target.value)}
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="Learning point..." />
                           <button onClick={() => removeLearning(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                              <X size={16} />
                           </button>
                        </div>
                     ))}
                  </div>
                  <button onClick={addLearning} className="mt-2 text-sm text-teal-600 hover:underline flex items-center gap-1">
                     <Plus size={14} /> Add learning point
                  </button>
               </div>

               {/* Why Attend */}
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Why Attend</label>
                  <textarea value={whyAttend} onChange={(e) => setWhyAttend(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                     rows={4} placeholder="Explain why attendees should come..." />
               </div>

               {/* FAQs */}
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">FAQs</label>
                  <div className="space-y-3">
                     {faqs.map((faq, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                           <div className="flex gap-2">
                              <input type="text" value={faq.question} onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                                 className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                 placeholder="Question" />
                              <button onClick={() => removeFaq(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded">
                                 <X size={16} />
                              </button>
                           </div>
                           <textarea value={faq.answer} onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                              rows={2} placeholder="Answer" />
                        </div>
                     ))}
                  </div>
                  <button onClick={addFaq} className="mt-2 text-sm text-teal-600 hover:underline flex items-center gap-1">
                     <Plus size={14} /> Add FAQ
                  </button>
               </div>
            </div>
         )}

         {/* Host Tab */}
         {activeTab === 'host' && (
            <div className="space-y-4">
               <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>Host info is templated in WordPress. These fields are stored for reference and future flexibility.</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-navy-900 mb-1">Host Name</label>
                     <input type="text" value={hostName} onChange={(e) => setHostName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Michael Eberhardt" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-navy-900 mb-1">Title</label>
                     <input type="text" value={hostTitle} onChange={(e) => setHostTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Retirement Income Specialist" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-navy-900 mb-1">Email</label>
                     <input type="email" value={hostEmail} onChange={(e) => setHostEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="host@example.com" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-navy-900 mb-1">Phone</label>
                     <input type="tel" value={hostPhone} onChange={(e) => setHostPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="(480) 726-8805" />
                  </div>
               </div>
            </div>
         )}

         {/* Advanced Tab */}
         {activeTab === 'advanced' && (
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Guide Download URL</label>
                  <input type="url" value={guideUrl} onChange={(e) => setGuideUrl(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                     placeholder="https://retirement-right.com/guides/..." />
               </div>
               <div>
                  <label className="block text-sm font-medium text-navy-900 mb-1">Privacy Disclaimer</label>
                  <textarea value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)}
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                     rows={4} placeholder="We respect your privacy..." />
               </div>
            </div>
         )}

         {/* Footer */}
         <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
            <button onClick={onClose} disabled={isSubmitting}
               className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
               Cancel
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting || !name.trim()}
               className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 flex items-center gap-2">
               {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (template ? 'Update Template' : 'Create Template')}
            </button>
         </div>
      </div>
   );
};

// ========== OCCURRENCE FORM ==========
interface OccurrenceFormProps {
   templateId: string;
   occurrence: EventOccurrence | null;
   onClose: () => void;
   onSuccess: () => void;
}

const OccurrenceForm: React.FC<OccurrenceFormProps> = ({ templateId, occurrence, onClose, onSuccess }) => {
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [wpStatus, setWpStatus] = useState<WPStatus>(occurrence?.wpStatus || 'draft');

   // Form state
   const [eventDate, setEventDate] = useState(occurrence?.eventDate ? occurrence.eventDate.split('T')[0] : '');
   const [startTime, setStartTime] = useState(occurrence?.startTime || '');
   const [venueName, setVenueName] = useState(occurrence?.venueName || '');
   const [room, setRoom] = useState(occurrence?.room || '');
   const [address, setAddress] = useState(occurrence?.address || '');
   const [city, setCity] = useState(occurrence?.city || '');
   const [state, setState] = useState(occurrence?.state || 'AZ');
   const [zipCode, setZipCode] = useState(occurrence?.zipCode || '');
   const [mapUrl, setMapUrl] = useState(occurrence?.mapUrl || '');

   const handleSubmit = async () => {
      if (!eventDate || !venueName || !address) {
         alert('Date, venue name, and address are required');
         return;
      }

      setIsSubmitting(true);
      try {
         const data: CreateOccurrenceInput = {
            eventDate,
            startTime: startTime || undefined,
            venueName,
            room: room || undefined,
            address,
            city: city || undefined,
            state: state || undefined,
            zipCode: zipCode || undefined,
            mapUrl: mapUrl || undefined,
            wpStatus,
         };

         if (occurrence) {
            await eventService.updateOccurrence(occurrence.id, { ...data, wpStatus });
         } else {
            await eventService.createOccurrence(templateId, data);
         }
         onSuccess();
      } catch (error) {
         console.error('Failed to save occurrence:', error);
         alert('Failed to save occurrence');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="space-y-4">
         {/* Date & Time */}
         <div className="grid grid-cols-3 gap-3">
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">Date *</label>
               <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">Start Time</label>
               <input type="text" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="6:00 PM" />
            </div>
         </div>

         {/* Venue */}
         <div className="grid grid-cols-2 gap-3">
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">Venue Name *</label>
               <input type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Freestone Recreation Center" />
            </div>
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">Room/Hall</label>
               <input type="text" value={room} onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Assembly Room" />
            </div>
         </div>

         {/* Address */}
         <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Street Address *</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
               className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="1141 East Guadalupe Road" />
         </div>
         <div className="grid grid-cols-3 gap-3">
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">City</label>
               <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Gilbert" />
            </div>
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">State</label>
               <input type="text" value={state} onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="AZ" />
            </div>
            <div>
               <label className="block text-sm font-medium text-navy-900 mb-1">ZIP</label>
               <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="85234" />
            </div>
         </div>

         {/* Map URL */}
         <div>
            <label className="block text-sm font-medium text-navy-900 mb-1">Google Maps URL</label>
            <input type="url" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)}
               className="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="https://maps.app.goo.gl/..." />
         </div>

         {/* WordPress Status */}
         <div className="p-4 bg-slate-50 rounded-lg">
            <label className="block text-sm font-medium text-navy-900 mb-2">WordPress Publishing</label>
            <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="wpStatus" checked={wpStatus === 'draft'}
                     onChange={() => setWpStatus('draft')} className="text-teal-500" />
                  <span className="text-sm">Save as Draft</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="wpStatus" checked={wpStatus === 'publish'}
                     onChange={() => setWpStatus('publish')} className="text-teal-500" />
                  <span className="text-sm">Publish Immediately</span>
               </label>
            </div>
         </div>

         {/* Footer */}
         <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button onClick={onClose} disabled={isSubmitting}
               className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
               Cancel
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting || !eventDate || !venueName || !address}
               className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 flex items-center gap-2">
               {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (occurrence ? 'Update' : 'Create & Sync')}
            </button>
         </div>
      </div>
   );
};

export default Workshops;