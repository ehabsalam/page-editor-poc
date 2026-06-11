import React from 'react';
import { EditableText } from '../../components/EditableText';
import { useEditor } from '../../components/EditorContext';
import type { CtaProps } from '../../types';

interface CtaSectionProps extends CtaProps {
  id: string;
}

export const CtaSection: React.FC<CtaSectionProps> = ({
  id,
  title,
  subtitle,
  buttonText,
  buttonLink,
}) => {
  const { isAdmin } = useEditor();

  return (
    <section className="py-20 px-6 bg-slate-950 text-white relative overflow-hidden">
      {/* Background neon blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900/80 border border-indigo-500/20 rounded-3xl p-10 md:p-16 text-center shadow-[0_10px_40px_rgba(99,102,241,0.05)] backdrop-blur-md">
          <EditableText
            sectionId={id}
            propKey="title"
            value={title}
            tagName="h2"
            className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4"
          />

          <EditableText
            sectionId={id}
            propKey="subtitle"
            value={subtitle}
            tagName="p"
            multiline={true}
            className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-light"
          />

          {/* Inline Email Newsletter Form */}
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 items-stretch justify-center">
            <input
              type="email"
              placeholder="Enter your email address..."
              disabled={isAdmin}
              className="bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-300 outline-none flex-1 transition-all"
            />
            {isAdmin ? (
              <div className="bg-indigo-600/30 border border-dashed border-indigo-400 rounded-xl px-4 py-2 flex items-center justify-center gap-2">
                <span className="text-xs text-indigo-300 font-medium">Btn:</span>
                <EditableText
                  sectionId={id}
                  propKey="buttonText"
                  value={buttonText}
                  tagName="span"
                  className="font-bold text-white uppercase tracking-wider text-xs outline-none"
                />
              </div>
            ) : (
              <a
                href={buttonLink || '#'}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.3)] flex items-center justify-center hover:-translate-y-0.5"
              >
                {buttonText}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
