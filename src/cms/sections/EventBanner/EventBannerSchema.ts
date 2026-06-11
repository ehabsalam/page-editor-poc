import { z } from 'zod';

export const EventBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  image: z.string().min(1, 'Image is required'),
  ctaText: z.string().optional().or(z.literal('')),
  ctaLink: z.string().optional().or(z.literal('')),
});

export type EventBannerSchemaType = z.infer<typeof EventBannerSchema>;
