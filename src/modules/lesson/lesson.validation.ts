import { z } from 'zod';

export const createLessonSchema = z.object({
  body: z.object({
    chapterId: z.string({ message: 'Chapter ID is required' }),
    title: z.string({ message: 'Title is required' }),
    videoUrl: z.string().optional(),
    notes: z.string().optional(),
    duration: z.number().optional(),
    order: z.number(),
    isPreview: z.boolean().optional(),
  }),
});
