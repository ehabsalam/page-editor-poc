import { z } from 'zod';

export const TestimonialsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  items: z.array(z.object({
    quote: z.string().min(1, 'Quote is required'),
    author: z.string().min(1, 'Author name is required'),
    role: z.string().min(1, 'Author role/tag is required'),
    avatar: z.string().min(1, 'Avatar image is required'),
  })).min(1, 'At least one testimonial is required'),
});

export type TestimonialsSchemaType = z.infer<typeof TestimonialsSchema>;
