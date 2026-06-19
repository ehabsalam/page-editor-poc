// Component Registry for Pixel Tavern CMS

import { PromoBannerSection } from './sections/PromoBanner/PromoBannerSection';
import { PromoBannerSchema } from './sections/PromoBanner/PromoBannerSchema';

import { HeroSection } from './sections/Hero/HeroSection';
import { HeroSchema } from './sections/Hero/HeroSchema';

import { FeaturedProductsSection } from './sections/FeaturedProducts/FeaturedProductsSection';
import { FeaturedProductsSchema } from './sections/FeaturedProducts/FeaturedProductsSchema';

import { EventBannerSection } from './sections/EventBanner/EventBannerSection';
import { EventBannerSchema } from './sections/EventBanner/EventBannerSchema';

import { TestimonialsSection } from './sections/Testimonials/TestimonialsSection';
import { TestimonialsSchema } from './sections/Testimonials/TestimonialsSchema';

import { CtaSection } from './sections/CTA/CtaSection';
import { CtaSchema } from './sections/CTA/CtaSchema';

import { FaqSection } from './sections/FAQ/FaqSection';
import { FaqSchema } from './sections/FAQ/FaqSchema';

// Maps section type name to React rendering component
export const componentRegistry: Record<string, React.ComponentType<any>> = {
  promoBanner: PromoBannerSection,
  hero: HeroSection,
  featuredProducts: FeaturedProductsSection,
  eventBanner: EventBannerSection,
  testimonials: TestimonialsSection,
  cta: CtaSection,
  faq: FaqSection,
};

// Maps section type to Zod validation schema
export const schemaRegistry: Record<string, any> = {
  promoBanner: PromoBannerSchema,
  hero: HeroSchema,
  featuredProducts: FeaturedProductsSchema,
  eventBanner: EventBannerSchema,
  testimonials: TestimonialsSchema,
  cta: CtaSchema,
  faq: FaqSchema,
};

// Maps section type to default props populated when adding a new section
export const defaultPropsRegistry: Record<string, Record<string, any>> = {
  promoBanner: {
    text: 'Summer Games Showcase! Save up to 50% on selected digital keys.',
    bgColor: '#1e1b4b',
    textColor: '#e0e7ff',
    link: '#featured-products',
  },
  hero: {
    title: 'Unleash Next-Gen Gaming',
    subtitle: 'Discover handpicked masterpieces, direct digital downloads, and exclusive keys with instant email delivery.',
    backgroundImage: '/images/hero-bg.jpg',
    ctaText: 'Browse Catalog',
    ctaLink: '#featured-products',
  },
  featuredProducts: {
    title: 'Featured Masterpieces',
    subtitle: 'Highly rated, critically acclaimed games ready to play today.',
    productIds: ['elden-ring', 'cyberpunk-2077', 'hades-ii', 'baldurs-gate-3'],
  },
  eventBanner: {
    title: 'Cyber Tournament 2026',
    description: 'Join our annual speedrunning and competitive esports tournament live stream. Register now for early bracket entry and exclusive in-game rewards.',
    date: 'June 24, 2026',
    image: '/images/event-banner.jpg',
    ctaText: 'Register Now',
    ctaLink: '#register',
  },
  testimonials: {
    title: 'What Our Players Say',
    items: [
      {
        quote: 'Pixel Tavern has the fastest key delivery I\'ve ever experienced. I bought Elden Ring and was in the game in less than 2 minutes!',
        author: 'Marcus V.',
        role: 'Verified Buyer',
        avatar: '/images/avatar-marcus.jpg',
      },
      {
        quote: 'The customer support is incredible. I had an issue with an epic key and they resolved it in less than 5 minutes.',
        author: 'Elena R.',
        role: 'Community Member',
        avatar: '/images/avatar-elena.jpg',
      },
    ],
  },
  cta: {
    title: 'Join the Pixel Tavern',
    subtitle: 'Sign up for our newsletter to receive weekly discount codes, tournament announcements, and developer interviews.',
    buttonText: 'Join Newsletter',
    buttonLink: '#newsletter',
  },
  faq: {
    title: 'Frequently Asked Questions',
    items: [
      {
        question: 'How do I redeem my game key?',
        answer: 'Once your payment is confirmed, the digital key is displayed immediately on the confirmation page and emailed to you. You can redeem it on Steam, Epic Games, or the respective console storefront.',
      },
      {
        question: 'Are the keys authorized?',
        answer: 'Yes, all game keys sold on Pixel Tavern are sourced directly from authorized publishers and distributors. We guarantee 100% genuine keys.',
      },
    ],
  },
};
