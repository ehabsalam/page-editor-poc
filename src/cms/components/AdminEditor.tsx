import React, { useState, useEffect } from 'react';
import type { DBProduct, SectionType, PageContent } from '../types';
import { useEditorStore } from '../../store/editorStore';
import { componentRegistry } from '../registry';
import { EditorContext } from './EditorContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Trash,
  Settings,
  Image as ImageIcon,
  Check,
  Upload,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  Globe,
  Loader2,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';

interface AdminEditorProps {
  pageId: string;
}

// ----------------------------------------------------
// Drag-and-Drop Sortable Sidebar Item Component
// ----------------------------------------------------
interface SortableItemProps {
  id: string;
  type: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, type, index, isActive, onClick, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const displayName = type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-3 rounded-xl border text-sm font-semibold transition-all ${
        isActive
          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Grab handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-slate-600 hover:text-slate-400 p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 9h2V7H8v2zm0 4h2v-2H8v2zm0 4h2v-2H8v2zm6-10h-2v2h2V7zm0 4h-2v2h2v-2zm0 4h-2v2h2v-2z" />
          </svg>
        </div>
        <span className="truncate select-none">
          {index + 1}. {displayName}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1"
      >
        <Trash className="w-4 h-4" />
      </button>
    </div>
  );
};

// ----------------------------------------------------
// Main AdminEditor SPA Component
// ----------------------------------------------------
export const AdminEditor: React.FC<AdminEditorProps> = ({ pageId }) => {
  const {
    pageData,
    selectedSectionId,
    isDirty,
    isSaving,
    setPageData,
    updateSeo,
    selectSection,
    updateSectionProps,
    addSection,
    removeSection,
    reorderSections,
    setDirty,
    setSaving,
  } = useEditorStore();

  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Picker states
  const [mediaPickerCallback, setMediaPickerCallback] = useState<((url: string) => void) | null>(null);
  const [mediaFiles, setMediaFiles] = useState<Array<{ id: string; filename: string; url: string }>>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [productPickerCallback, setProductPickerCallback] = useState<((selectedIds: string[]) => void) | null>(null);
  const [allProducts, setAllProducts] = useState<DBProduct[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Section Catalog Modal
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);

  // Revision Modal
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);

  // Setup dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Fetch page layout on mount
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/pages/${pageId}`);
        if (!res.ok) throw new Error('Failed to load page content');
        const data = await res.json() as { 
          id: string; 
          title: string; 
          slug: string; 
          draft: PageContent | null; 
          published: PageContent | null; 
        };

        // Use draft if available, fall back to published, or create blank structure
        const pageContent: PageContent = data.draft || data.published || {
          id: data.id,
          slug: data.slug,
          seo: {
            title: data.title || 'New Page',
            description: '',
          },
          sections: [],
        };

        setPageData(pageContent);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load editor layout.');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [pageId]);

  // Load available products from D1 API on mount
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json() as DBProduct[];
          setAllProducts(data);
        }
      } catch (err) {
        console.error('Failed to load products list:', err);
      }
    };
    fetchAllProducts();
  }, []);

  // Save draft layout
  const handleSaveDraft = async () => {
    if (!pageData) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/draft`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seo: pageData.seo,
          sections: pageData.sections,
        }),
      });

      if (!res.ok) throw new Error('Failed to save draft content.');
      setDirty(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving draft.');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save draft changes every 30 seconds if dirty
  useEffect(() => {
    if (!isDirty || isSaving || !pageData) return;

    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 15000); // 15 seconds auto-save delay

    return () => clearTimeout(timer);
  }, [isDirty, pageData]);

  // Publish Draft & bump revision
  const handlePublish = async () => {
    if (!pageData) return;
    if (isDirty) {
      // Prompt to save before publishing
      if (confirm('You have unsaved changes. Save and publish now?')) {
        await handleSaveDraft();
      } else {
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/publish`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to publish changes.');
      alert('Page successfully published to production storefront!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error publishing page.');
    } finally {
      setSaving(false);
    }
  };

  // Reordering handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSections(active.id as string, over.id as string);
    }
  };

  // Open Media Library Modal
  const openMediaPicker = async (onSelect: (url: string) => void) => {
    setMediaPickerCallback(() => onSelect);
    setMediaLoading(true);
    try {
      const res = await fetch('/api/media');
      if (res.ok) {
        const data = await res.json() as Array<{ id: string; filename: string; url: string }>;
        setMediaFiles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMediaLoading(false);
    }
  };

  // Upload new image to R2 API
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload image.');
      const data = await res.json() as { id: string; filename: string; url: string };
      
      // Update files list
      setMediaFiles((prev) => [data, ...prev]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to upload image asset.');
    } finally {
      setUploading(false);
    }
  };

  // Open Product Checkbox Selector Modal
  const openProductPicker = (selectedIds: string[], onSelect: (selectedIds: string[]) => void) => {
    setSelectedProductIds(selectedIds);
    setProductPickerCallback(() => onSelect);
  };

  // Load Revisions list
  const loadRevisions = async () => {
    setRevisionsLoading(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/revisions`);
      if (res.ok) {
        const data = await res.json() as any[];
        setRevisions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevisionsLoading(false);
    }
  };

  // Rollback to revision snapshot
  const handleRollback = async (revisionId: string) => {
    if (!confirm('Are you sure you want to rollback this draft? Unsaved changes will be overwritten.')) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revisionId }),
      });

      if (!res.ok) throw new Error('Failed to roll back draft.');
      const data = await res.json() as { restoredDraft: PageContent };
      setPageData(data.restoredDraft);
      setShowRevisionModal(false);
      alert('Draft successfully rolled back to selected revision snapshot!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error during rollback.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-slate-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="text-slate-400 text-sm font-semibold tracking-wide">Initialising Page Editor...</span>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Open Editor</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'Page data is missing.'}</p>
          <a href="/admin" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold uppercase tracking-wider block text-center">
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Get active selected section
  const selectedSection = pageData.sections.find((s) => s.id === selectedSectionId);

  return (
    <EditorContext.Provider
      value={{
        isAdmin: !isPreview,
        onUpdateProps: updateSectionProps,
        selectedSectionId,
        onSelectSection: selectSection,
        openMediaPicker,
        openProductPicker,
      }}
    >
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
        {/* ============================================================== */}
        {/* TOP CONTROL BAR */}
        {/* ============================================================== */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-900 bg-slate-950 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-extrabold text-white text-base">Editing: {pageData.seo.title}</h2>
                <span className="text-slate-500 text-xs font-mono">({pageData.slug})</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 font-semibold tracking-wider">
                {isDirty ? (
                  <span className="text-amber-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Unsaved Changes
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Auto-saved to Draft
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Preview Mode */}
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${
                isPreview
                  ? 'bg-slate-900 border-indigo-500 text-indigo-400 hover:border-indigo-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isPreview ? 'Back to Edit' : 'Preview Live'}</span>
            </button>

            {/* View History Button */}
            {!isPreview && (
              <button
                onClick={() => {
                  setShowRevisionModal(true);
                  loadRevisions();
                }}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-xl text-slate-300 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>History</span>
              </button>
            )}

            {/* Save Draft */}
            {!isPreview && (
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || !isDirty}
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 rounded-xl text-white transition-all"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Draft</span>
              </button>
            )}

            {/* Publish */}
            {!isPreview && (
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="flex items-center gap-2 text-xs font-semibold px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 border border-transparent disabled:border-slate-800 rounded-xl text-white shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all flex-shrink-0 active:scale-95"
              >
                <Globe className="w-4 h-4" />
                <span>Publish Storefront</span>
              </button>
            )}
          </div>
        </header>

        {/* ============================================================== */}
        {/* WORKSPACE LAYOUT (3 PANELS) */}
        {/* ============================================================== */}
        <div className="flex-1 flex overflow-hidden">
          {/* ------------------------------------------------------------ */}
          {/* PANEL 1: LEFT SIDEBAR OUTLINE (DRAG & DROP) */}
          {/* ------------------------------------------------------------ */}
          {!isPreview && (
            <aside className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col justify-between overflow-hidden flex-shrink-0">
              <div className="p-5 overflow-y-auto flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Page Outline</h3>
                  <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                    {pageData.sections.length} Sections
                  </span>
                </div>

                {/* Vertical Dnd Sortable Outline */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pageData.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2.5 flex-grow">
                      {pageData.sections.map((section, index) => (
                        <SortableItem
                          key={section.id}
                          id={section.id}
                          type={section.type}
                          index={index}
                          isActive={selectedSectionId === section.id}
                          onClick={() => selectSection(section.id)}
                          onRemove={() => {
                            if (confirm('Delete this section layout?')) removeSection(section.id);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Add Section Button */}
                <button
                  onClick={() => setShowAddSectionModal(true)}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 border border-dashed border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all hover:bg-indigo-950/10 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Section</span>
                </button>
              </div>
            </aside>
          )}

          {/* ------------------------------------------------------------ */}
          {/* PANEL 2: CENTER CANVAS WORKSPACE */}
          {/* ------------------------------------------------------------ */}
          <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col">
            <div className={`w-full flex-1 ${isPreview ? 'max-w-7xl mx-auto my-0' : ''}`}>
              {pageData.sections.length === 0 ? (
                <div className="h-full flex items-center justify-center p-12">
                  <div className="text-center p-8 border border-dashed border-slate-800 rounded-3xl max-w-sm">
                    <p className="text-slate-500 text-sm mb-4">No content sections added to this page layout.</p>
                    <button
                      onClick={() => setShowAddSectionModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold tracking-wider text-white"
                    >
                      Add First Section
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {pageData.sections.map((section, idx) => {
                    const Component = componentRegistry[section.type];
                    const isSelected = selectedSectionId === section.id;
                    
                    if (!Component) return null;

                    if (isPreview) {
                      return <Component key={section.id} id={section.id} {...section.props} />;
                    }

                    // Render with Admin Wrapper for outline, reorder, delete actions
                    return (
                      <div
                        key={section.id}
                        onClick={() => selectSection(section.id)}
                        className={`relative group/wrapper border-t-2 border-b-2 transition-all ${
                          isSelected
                            ? 'border-indigo-500/80 bg-indigo-950/5/5 shadow-[0_0_25px_rgba(99,102,241,0.02)]'
                            : 'border-transparent hover:border-slate-800'
                        }`}
                      >
                        {/* Selected Indicator Outline & Overlay */}
                        {isSelected && (
                          <div className="absolute inset-x-0 -top-[2px] -bottom-[2px] border-2 border-indigo-500 pointer-events-none z-20" />
                        )}

                        {/* Control actions header (shows on hover or selection) */}
                        <div className="absolute top-2 left-4 z-20 opacity-0 group-hover/wrapper:opacity-100 group-[.selected]/wrapper:opacity-100 flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 rounded-lg p-1.5 shadow-xl transition-opacity">
                          <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-500/20 mr-2">
                            {section.type.replace(/([A-Z])/g, ' $1')}
                          </span>

                          {/* Move Up */}
                          <button
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx > 0) reorderSections(section.id, pageData.sections[idx - 1].id);
                            }}
                            className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Down */}
                          <button
                            disabled={idx === pageData.sections.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (idx < pageData.sections.length - 1) reorderSections(section.id, pageData.sections[idx + 1].id);
                            }}
                            className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded-md disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          <div className="w-[1px] h-3 bg-slate-800 mx-1"></div>

                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this section?')) removeSection(section.id);
                            }}
                            className="p-1 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-md"
                            title="Delete Section"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Component Renderer */}
                        <div className="relative">
                          <Component id={section.id} {...section.props} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* ------------------------------------------------------------ */}
          {/* PANEL 3: RIGHT PROPERTIES SIDEBAR */}
          {/* ------------------------------------------------------------ */}
          {!isPreview && (
            <aside className="w-80 border-l border-slate-900 bg-slate-950 flex flex-col overflow-y-auto flex-shrink-0">
              <div className="p-5 space-y-6">
                {selectedSection ? (
                  /* SECTION SPECIFIC CONFIGURATION */
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Section Settings</span>
                        <h3 className="font-extrabold text-white text-base">
                          {selectedSection.type.charAt(0).toUpperCase() + selectedSection.type.slice(1).replace(/([A-Z])/g, ' $1')}
                        </h3>
                      </div>
                      <button
                        onClick={() => selectSection(null)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Section Layout controls depending on type */}
                      {selectedSection.type === 'promoBanner' && (
                        <>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Background Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={selectedSection.props.bgColor || '#1e1b4b'}
                                onChange={(e) => updateSectionProps(selectedSection.id, { bgColor: e.target.value })}
                                className="w-10 h-10 border border-slate-800 rounded bg-slate-950 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedSection.props.bgColor || '#1e1b4b'}
                                onChange={(e) => updateSectionProps(selectedSection.id, { bgColor: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 text-sm flex-1 text-slate-300 uppercase"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Text Color</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={selectedSection.props.textColor || '#e0e7ff'}
                                onChange={(e) => updateSectionProps(selectedSection.id, { textColor: e.target.value })}
                                className="w-10 h-10 border border-slate-800 rounded bg-slate-950 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedSection.props.textColor || '#e0e7ff'}
                                onChange={(e) => updateSectionProps(selectedSection.id, { textColor: e.target.value })}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 text-sm flex-1 text-slate-300 uppercase"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Banner Link</label>
                            <input
                              type="text"
                              value={selectedSection.props.link || ''}
                              onChange={(e) => updateSectionProps(selectedSection.id, { link: e.target.value })}
                              placeholder="e.g. #featured-products"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </>
                      )}

                      {selectedSection.type === 'hero' && (
                        <>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">CTA Action Link</label>
                            <input
                              type="text"
                              value={selectedSection.props.ctaLink || ''}
                              onChange={(e) => updateSectionProps(selectedSection.id, { ctaLink: e.target.value })}
                              placeholder="e.g. #featured-products"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </>
                      )}

                      {selectedSection.type === 'eventBanner' && (
                        <>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">CTA Action Link</label>
                            <input
                              type="text"
                              value={selectedSection.props.ctaLink || ''}
                              onChange={(e) => updateSectionProps(selectedSection.id, { ctaLink: e.target.value })}
                              placeholder="e.g. #register"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </>
                      )}

                      {selectedSection.type === 'cta' && (
                        <>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Action Link</label>
                            <input
                              type="text"
                              value={selectedSection.props.buttonLink || ''}
                              onChange={(e) => updateSectionProps(selectedSection.id, { buttonLink: e.target.value })}
                              placeholder="e.g. #newsletter"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </>
                      )}

                      {/* Display deletion action in right sidebar for convenience */}
                      <div className="pt-6 border-t border-slate-900 mt-6">
                        <button
                          onClick={() => {
                            if (confirm('Delete this section layout?')) removeSection(selectedSection.id);
                          }}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 hover:text-red-300 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all"
                        >
                          <Trash className="w-4 h-4" />
                          <span>Delete Section</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* GENERAL PAGE METADATA CONFIGURATION */
                  <div>
                    <div className="border-b border-slate-900 pb-4 mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">General Configuration</span>
                      <h3 className="font-extrabold text-white text-base">Page Settings</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Meta Title</label>
                        <input
                          type="text"
                          value={pageData.seo.title}
                          onChange={(e) => updateSeo({ title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Meta Description</label>
                        <textarea
                          value={pageData.seo.description}
                          onChange={(e) => updateSeo({ description: e.target.value })}
                          rows={4}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500 resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Open Graph Share Image</label>
                          <button
                            onClick={() => {
                              openMediaPicker((url) => updateSeo({ ogImage: url }));
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Library
                          </button>
                        </div>
                        <input
                          type="text"
                          value={pageData.seo.ogImage || ''}
                          onChange={(e) => updateSeo({ ogImage: e.target.value })}
                          placeholder="e.g. /images/hero-bg.jpg"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW SECTION MODAL */}
      {/* ============================================================== */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Choose Section Component
              </h3>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3.5">
              {(Object.keys(componentRegistry) as SectionType[]).map((type) => {
                const displayName = type.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                
                return (
                  <button
                    key={type}
                    onClick={() => {
                      addSection(type);
                      setShowAddSectionModal(false);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl text-left transition-all group active:scale-98"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                        {displayName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 select-none">
                        Insert a pre-configured {displayName.toLowerCase()} into your layout.
                      </p>
                    </div>
                    <Plus className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: MEDIA LIBRARY PICKER MODAL */}
      {/* ============================================================== */}
      {mediaPickerCallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white">Media Library Picker</h3>
              <button
                onClick={() => setMediaPickerCallback(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload Area */}
            <div className="p-6 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-400 max-w-xs">
                Upload image assets directly to Cloudflare R2 bucket (.png, .jpg, .webp, max 5MB).
              </div>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md transition-all active:scale-95">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Grid display */}
            <div className="flex-1 p-6 overflow-y-auto min-h-[300px]">
              {mediaLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
                  <span>No uploaded assets in library yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {mediaFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => {
                        mediaPickerCallback(file.url);
                        setMediaPickerCallback(null);
                      }}
                      className="group border border-slate-800 hover:border-indigo-500 rounded-xl overflow-hidden cursor-pointer relative aspect-square bg-slate-950 transition-all hover:shadow-lg"
                    >
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-end p-2 transition-opacity">
                        <span className="text-[10px] text-white font-medium truncate w-full">
                          {file.filename}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: PRODUCT CHECKBOX SELECTOR MODAL */}
      {/* ============================================================== */}
      {productPickerCallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white">Select Game Catalog Products</h3>
              <button
                onClick={() => setProductPickerCallback(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {allProducts.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-12">
                  No games found in the products database.
                </div>
              ) : (
                allProducts.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedProductIds(selectedProductIds.filter((id) => id !== prod.id));
                        } else {
                          setSelectedProductIds([...selectedProductIds, prod.id]);
                        }
                      }}
                      className={`flex items-center gap-4 p-3 border rounded-2xl cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-950'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{prod.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{prod.category} &bull; ${prod.price.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setProductPickerCallback(null)}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  productPickerCallback(selectedProductIds);
                  setProductPickerCallback(null);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold uppercase tracking-wider"
              >
                Apply Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: REVISION HISTORY SNAPSHOTS MODAL */}
      {/* ============================================================== */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-400" /> Revision History Snapshots
              </h3>
              <button
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {revisionsLoading ? (
                <div className="h-full flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : revisions.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No published revision snapshots found for this page.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-700/60 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-white bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            Rev #{rev.revision_number}
                          </span>
                          <span className="text-[10px] text-slate-500">Timestamp</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(rev.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRollback(rev.id)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 flex-shrink-0"
                      >
                        Restore Draft
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </EditorContext.Provider>
  );
};
export default AdminEditor;
