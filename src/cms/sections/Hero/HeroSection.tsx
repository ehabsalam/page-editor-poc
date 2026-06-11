import React from 'react';
import { EditableText } from '../../components/EditableText';
import { useEditor } from '../../components/EditorContext';
import { Image as ImageIcon } from 'lucide-react';
import type { HeroProps } from '../../types';

interface HeroSectionProps extends HeroProps {
  id: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  id,
  title,
  subtitle,
  backgroundImage,
  ctaText,
  ctaLink,
}) => {
  const { isAdmin, openMediaPicker, onUpdateProps } = useEditor();

  const handleBgClick = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.stopPropagation();
    if (openMediaPicker && onUpdateProps) {
      openMediaPicker((newUrl) => {
        onUpdateProps(id, { backgroundImage: newUrl });
      });
    }
  };

  return (
    <section 
      className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center bg-slate-900 overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage || '/images/hero-bg.jpg'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Premium Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

      {/* Grid Pattern overlay for depth */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Editor Background Overlay Trigger */}
      {isAdmin && (
        <button
          onClick={handleBgClick}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-950/80 hover:bg-slate-900 border border-indigo-500/50 hover:border-indigo-400 text-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-all"
        >
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          Change Background Image
        </button>
      )}

      {/* Content Area */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center">
        {/* Glow Accent */}
        <div className="w-24 h-1 bg-indigo-500 rounded-full mb-8 shadow-[0_0_15px_#6366f1] animate-pulse" />

        <EditableText
          sectionId={id}
          propKey="title"
          value={title}
          tagName="h1"
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6"
        />

        <EditableText
          sectionId={id}
          propKey="subtitle"
          value={subtitle}
          tagName="p"
          multiline={true}
          className="text-lg md:text-xl text-slate-300 max-w-2xl mb-10 leading-relaxed font-light"
        />

        {/* CTA Button */}
        {(ctaText || isAdmin) && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {isAdmin ? (
              <div className="bg-indigo-600/30 border border-dashed border-indigo-400 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="text-xs text-indigo-300 font-medium">Button Text:</span>
                <EditableText
                  sectionId={id}
                  propKey="ctaText"
                  value={ctaText || 'Button'}
                  tagName="span"
                  className="font-bold text-white uppercase tracking-wider text-sm outline-none"
                />
              </div>
            ) : (
              <a
                href={ctaLink || '#'}
                className="relative group/btn overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold uppercase tracking-wider text-sm px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.6)] transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Button shine animation */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shine_1.5s_infinite]" />
                {ctaText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
