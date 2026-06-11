import React from 'react';
import { EditableText } from '../../components/EditableText';
import type { PromoBannerProps } from '../../types';

interface PromoBannerSectionProps extends PromoBannerProps {
  id: string;
}

export const PromoBannerSection: React.FC<PromoBannerSectionProps> = ({
  id,
  text,
  bgColor,
  textColor,
  link,
}) => {
  const bannerStyle = {
    backgroundColor: bgColor,
    color: textColor,
  };

  const content = (
    <div className="max-w-7xl mx-auto px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
      <EditableText
        sectionId={id}
        propKey="text"
        value={text}
        tagName="span"
        className="font-medium"
      />
      {link && !id.startsWith('editor-') && (
        <span className="underline ml-1 cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
          Learn More &rarr;
        </span>
      )}
    </div>
  );

  if (link && link.trim() !== '') {
    return (
      <a href={link} className="block transition-all duration-300 hover:brightness-110" style={bannerStyle}>
        {content}
      </a>
    );
  }

  return (
    <div style={bannerStyle} className="transition-all duration-300">
      {content}
    </div>
  );
};
