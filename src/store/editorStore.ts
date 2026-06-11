import { create } from 'zustand';
import type { PageContent, Section, SectionType } from '../cms/types';
import { defaultPropsRegistry } from '../cms/registry';

interface EditorState {
  pageData: PageContent | null;
  selectedSectionId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  
  // Actions
  setPageData: (data: PageContent) => void;
  updateSeo: (fields: Partial<PageContent['seo']>) => void;
  selectSection: (sectionId: string | null) => void;
  updateSectionProps: (sectionId: string, updatedProps: Record<string, any>) => void;
  addSection: (type: SectionType, index?: number) => void;
  removeSection: (sectionId: string) => void;
  reorderSections: (activeId: string, overId: string) => void;
  setDirty: (isDirty: boolean) => void;
  setSaving: (isSaving: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  pageData: null,
  selectedSectionId: null,
  isDirty: false,
  isSaving: false,

  setPageData: (data) => set({ pageData: data, isDirty: false }),

  updateSeo: (fields) => set((state) => {
    if (!state.pageData) return {};
    return {
      pageData: {
        ...state.pageData,
        seo: { ...state.pageData.seo, ...fields }
      },
      isDirty: true
    };
  }),

  selectSection: (sectionId) => set({ selectedSectionId: sectionId }),

  updateSectionProps: (sectionId, updatedProps) => set((state) => {
    if (!state.pageData) return {};
    
    // Deep clone the sections to preserve immutability
    const newSections = structuredClone(state.pageData.sections);
    const section = newSections.find((s) => s.id === sectionId);
    
    if (section) {
      for (const [path, value] of Object.entries(updatedProps)) {
        const keys = path.split('.');
        let current = section.props;
        
        // Traverse and build nesting as needed
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!(key in current)) {
            // Check if next key is a number to decide between array or object
            current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
          }
          current = current[key];
        }
        
        // Set the leaf value
        current[keys[keys.length - 1]] = value;
      }
      
      return {
        pageData: {
          ...state.pageData,
          sections: newSections
        },
        isDirty: true
      };
    }
    
    return {};
  }),

  addSection: (type, index) => set((state) => {
    if (!state.pageData) return {};
    
    const newSection: Section = {
      id: `${type}-${crypto.randomUUID().slice(0, 8)}`,
      type,
      props: structuredClone(defaultPropsRegistry[type] || {})
    };
    
    const newSections = [...state.pageData.sections];
    if (typeof index === 'number') {
      newSections.splice(index, 0, newSection);
    } else {
      newSections.push(newSection);
    }
    
    return {
      pageData: {
        ...state.pageData,
        sections: newSections
      },
      selectedSectionId: newSection.id,
      isDirty: true
    };
  }),

  removeSection: (sectionId) => set((state) => {
    if (!state.pageData) return {};
    
    const newSections = state.pageData.sections.filter((s) => s.id !== sectionId);
    
    return {
      pageData: {
        ...state.pageData,
        sections: newSections
      },
      selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId,
      isDirty: true
    };
  }),

  reorderSections: (activeId, overId) => set((state) => {
    if (!state.pageData) return {};
    
    const sections = state.pageData.sections;
    const oldIndex = sections.findIndex((s) => s.id === activeId);
    const newIndex = sections.findIndex((s) => s.id === overId);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newSections = [...sections];
      const [removed] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, removed);
      
      return {
        pageData: {
          ...state.pageData,
          sections: newSections
        },
        isDirty: true
      };
    }
    
    return {};
  }),

  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving })
}));
