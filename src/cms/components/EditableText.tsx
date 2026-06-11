import React, { useState, useEffect } from 'react';
import { useEditor } from './EditorContext';

interface EditableTextProps {
  sectionId: string;
  propKey: string;
  value: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  sectionId,
  propKey,
  value,
  tagName: Tag = 'span',
  className = '',
  placeholder = 'Click to edit...',
  multiline = false,
}) => {
  const { isAdmin, onUpdateProps } = useEditor();
  const [localValue, setLocalValue] = useState(value);

  // Sync with prop changes (like undo or loading new data)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (!isAdmin) {
    return <Tag className={className}>{value || ''}</Tag>;
  }

  const handleBlur = () => {
    if (localValue !== value) {
      onUpdateProps(sectionId, { [propKey]: localValue });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  if (multiline) {
    return (
      <textarea
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full bg-transparent border border-dashed border-indigo-400/60 rounded px-1 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-400/30 resize-y min-h-[60px] ${className}`}
      />
    );
  }

  return (
    <input
      type="text"
      value={localValue || ''}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full bg-transparent border border-dashed border-indigo-400/60 rounded px-1 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-400/30 ${className}`}
    />
  );
};
