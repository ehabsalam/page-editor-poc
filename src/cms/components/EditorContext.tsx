import React, { createContext, useContext } from 'react';

interface EditorContextProps {
  isAdmin: boolean;
  onUpdateProps: (sectionId: string, updatedProps: Record<string, any>) => void;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
  openMediaPicker?: (onSelect: (url: string) => void) => void;
  openProductPicker?: (selectedIds: string[], onSelect: (selectedIds: string[]) => void) => void;
}

export const EditorContext = createContext<EditorContextProps>({
  isAdmin: false,
  onUpdateProps: () => {},
  selectedSectionId: null,
});

export const useEditor = () => useContext(EditorContext);
