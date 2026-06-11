import { z } from 'zod';

export const FeaturedProductsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional().or(z.literal('')),
  productIds: z.array(z.string()).min(1, 'At least one product must be selected'),
});

export type FeaturedProductsSchemaType = z.infer<typeof FeaturedProductsSchema>;
