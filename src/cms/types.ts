// CMS Page content types

export interface SeoMetadata {
  title: string;
  description: string;
  ogImage?: string;
}

export type SectionType =
  | 'promoBanner'
  | 'hero'
  | 'featuredProducts'
  | 'eventBanner'
  | 'testimonials'
  | 'cta'
  | 'faq';

export interface Section {
  id: string;
  type: SectionType;
  props: Record<string, any>;
}

export interface PageContent {
  id: string;
  slug: string;
  seo: SeoMetadata;
  sections: Section[];
}

// Concrete component prop types

export interface PromoBannerProps {
  text: string;
  bgColor: string;
  textColor: string;
  link?: string;
}

export interface HeroProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  productIds: string[];
}

export interface EventBannerProps {
  title: string;
  description: string;
  date: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

export interface TestimonialsProps {
  title: string;
  items: TestimonialItem[];
}

export interface CtaProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  title: string;
  items: FaqItem[];
}

// Database Product Type
export interface DBProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description?: string;
  category: string;
}
