import React from 'react';
import { EditableText } from '../../components/EditableText';
import { EditableImage } from '../../components/EditableImage';
import { useEditor } from '../../components/EditorContext';
import { Calendar } from 'lucide-react';
import type { EventBannerProps } from '../../types';

interface EventBannerSectionProps extends EventBannerProps {
  id: string;
}

export const EventBannerSection: React.FC<EventBannerSectionProps> = ({
  id,
  title,
  description,
  date,
  image,
  ctaText,
  ctaLink,
}) => {
  const { isAdmin } = useEditor();

  return (
    <section className="py-20 px-6 bg-slate-900 border-y border-slate-800 text-white relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Interactive Image Preview */}
        <div className="lg:col-span-5 relative">
          {/* Neon Border Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <EditableImage
            sectionId={id}
            propKey="image"
            src={image}
            alt={title}
            className="w-full aspect-[4/3] object-cover rounded-2xl"
            containerClassName="border border-slate-800"
          />
        </div>

        {/* Right Side: Event details */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Date Tag */}
          <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-3.5 py-1.5 rounded-full mb-6 font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <EditableText
              sectionId={id}
              propKey="date"
              value={date}
              tagName="span"
              className="outline-none"
            />
          </div>

          <EditableText
            sectionId={id}
            propKey="title"
            value={title}
            tagName="h2"
            className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4"
          />

          <EditableText
            sectionId={id}
            propKey="description"
            value={description}
            tagName="p"
            multiline={true}
            className="text-slate-300 text-base md:text-lg mb-8 leading-relaxed font-light"
          />

          {/* CTA Link & Button Text */}
          {(ctaText || isAdmin) && (
            <div className="mt-2">
              {isAdmin ? (
                <div className="bg-indigo-600/30 border border-dashed border-indigo-400 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="text-xs text-indigo-300 font-medium">Button:</span>
                  <EditableText
                    sectionId={id}
                    propKey="ctaText"
                    value={ctaText || 'Button'}
                    tagName="span"
                    className="font-bold text-white uppercase tracking-wider text-xs outline-none"
                  />
                </div>
              ) : (
                <a
                  href={ctaLink || '#'}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold uppercase tracking-wider text-xs px-6 py-3.5 rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5"
                >
                  {ctaText}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
