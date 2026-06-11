import { z } from 'zod';

export const FaqSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  items: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
  })).min(1, 'At least one FAQ item is required'),
});

export type FaqSchemaType = z.infer<typeof FaqSchema>;
