import { z } from 'zod';

export const PromoBannerSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  bgColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code'),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color code'),
  link: z.string().optional().or(z.literal('')),
});

export type PromoBannerSchemaType = z.infer<typeof PromoBannerSchema>;
