import React from 'react';
import { EditableText } from '../../components/EditableText';
import { EditableImage } from '../../components/EditableImage';
import { Quote } from 'lucide-react';
import type { TestimonialsProps } from '../../types';

interface TestimonialsSectionProps extends TestimonialsProps {
  id: string;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  id,
  title,
  items,
}) => {
  return (
    <section className="py-20 px-6 bg-slate-900 border-t border-slate-800 text-white relative">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <EditableText
            sectionId={id}
            propKey="title"
            value={title}
            tagName="h2"
            className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2"
          />
          <div className="w-12 h-1 bg-indigo-500 mx-auto rounded-full mt-4 shadow-[0_0_10px_#6366f1]" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-md relative hover:border-slate-700/60 transition-all flex flex-col justify-between"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 w-8 h-8 text-indigo-500/10 pointer-events-none" />

              {/* Quote Text */}
              <div className="mb-6 relative z-10">
                <EditableText
                  sectionId={id}
                  propKey={`items.${index}.quote`}
                  value={item.quote}
                  tagName="p"
                  multiline={true}
                  className="text-slate-300 text-sm md:text-base leading-relaxed italic font-light"
                  placeholder="Edit review quote..."
                />
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-900/60">
                <EditableImage
                  sectionId={id}
                  propKey={`items.${index}.avatar`}
                  src={item.avatar}
                  alt={item.author}
                  className="w-12 h-12 rounded-full object-cover border border-indigo-500/20"
                  containerClassName="w-12 h-12 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <EditableText
                    sectionId={id}
                    propKey={`items.${index}.author`}
                    value={item.author}
                    tagName="h4"
                    className="font-bold text-white text-sm tracking-wide block truncate"
                    placeholder="Author name..."
                  />
                  <EditableText
                    sectionId={id}
                    propKey={`items.${index}.role`}
                    value={item.role}
                    tagName="span"
                    className="text-indigo-400 text-xs font-semibold block truncate mt-0.5"
                    placeholder="Author role..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
