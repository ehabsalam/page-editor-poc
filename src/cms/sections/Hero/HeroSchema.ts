import { z } from 'zod';

export const HeroSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  backgroundImage: z.string().min(1, 'Background image is required'),
  ctaText: z.string().optional().or(z.literal('')),
  ctaLink: z.string().optional().or(z.literal('')),
});

export type HeroSchemaType = z.infer<typeof HeroSchema>;
