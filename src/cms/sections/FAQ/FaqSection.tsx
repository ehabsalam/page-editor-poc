import React, { useState } from 'react';
import { EditableText } from '../../components/EditableText';
import { ChevronDown } from 'lucide-react';
import type { FaqProps } from '../../types';

interface FaqSectionProps extends FaqProps {
  id: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  id,
  title,
  items,
}) => {
  // Track open indices. In Admin editor, it's helpful if we open all by default, or just let them click to expand.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 px-6 bg-slate-950 text-white relative">
      <div className="max-w-4xl mx-auto">
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

        {/* Accordions */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div 
                key={index} 
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Header/Question Trigger */}
                <button
                  type="button"
                  onClick={() => toggleIndex(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-white focus:outline-none focus:bg-slate-900/60"
                >
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <EditableText
                      sectionId={id}
                      propKey={`items.${index}.question`}
                      value={item.question}
                      tagName="span"
                      className="text-base md:text-lg text-white font-bold block"
                      placeholder="Enter question..."
                    />
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-indigo-400 transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Content/Answer Panel */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-[300px] border-t border-slate-800/60' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 py-5 text-sm md:text-base text-slate-300 leading-relaxed font-light bg-slate-900/30">
                    <EditableText
                      sectionId={id}
                      propKey={`items.${index}.answer`}
                      value={item.answer}
                      tagName="p"
                      multiline={true}
                      className="w-full"
                      placeholder="Enter answer..."
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
