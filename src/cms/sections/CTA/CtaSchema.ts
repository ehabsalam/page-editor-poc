import { z } from 'zod';

export const CtaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  buttonText: z.string().min(1, 'Button text is required'),
  buttonLink: z.string().min(1, 'Button link is required'),
});

export type CtaSchemaType = z.infer<typeof CtaSchema>;
