import { z } from 'zod';

export const createChapterSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Title is required' }),
    codeRange: z.string().optional(),
    description: z.string().optional(),
    order: z.number(),
    isPublished: z.boolean().optional(),
  }),
});

export const updateChapterSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    codeRange: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    isPublished: z.boolean().optional(),
  }),
});
