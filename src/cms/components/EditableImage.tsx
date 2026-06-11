import React from 'react';
import { useEditor } from './EditorContext';
import { Image as ImageIcon } from 'lucide-react';

interface EditableImageProps {
  sectionId: string;
  propKey: string;
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export const EditableImage: React.FC<EditableImageProps> = ({
  sectionId,
  propKey,
  src,
  alt,
  className = '',
  containerClassName = '',
}) => {
  const { isAdmin, openMediaPicker } = useEditor();

  // Retrieve onUpdateProps from EditorContext
  const { onUpdateProps } = useEditor();

  const triggerPicker = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.stopPropagation();
    if (openMediaPicker && onUpdateProps) {
      openMediaPicker((newUrl) => {
        onUpdateProps(sectionId, { [propKey]: newUrl });
      });
    }
  };

  if (!isAdmin) {
    return (
      <img
        src={src || '/placeholder-game.jpg'}
        alt={alt}
        className={className}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`relative group/image overflow-hidden rounded-lg ${containerClassName}`}>
      <img
        src={src || '/placeholder-game.jpg'}
        alt={alt}
        className={`${className} transition-all duration-300 group-hover/image:scale-105`}
      />
      {/* Admin overlay */}
      <div 
        onClick={triggerPicker}
        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/image:opacity-100 flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity duration-200 border-2 border-dashed border-indigo-400 m-1 rounded-md"
      >
        <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-500 transition-colors">
          <ImageIcon className="w-5 h-5" />
        </div>
        <span className="text-xs text-indigo-100 font-semibold tracking-wider uppercase">
          Change Image
        </span>
      </div>
    </div>
  );
};
