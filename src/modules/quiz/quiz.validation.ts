import { z } from 'zod';

export const createQuizSchema = z.object({
  body: z.object({
    chapterId: z.string({ message: 'Chapter ID is required' }),
    title: z.string({ message: 'Title is required' }),
    description: z.string().optional(),
    timeLimit: z.number().optional(),
    totalMarks: z.number().optional(),
  }),
});

export const createQuestionSchema = z.object({
  body: z.object({
    quizId: z.string().optional(),
    chapterId: z.string({ message: 'Chapter ID is required' }),
    question: z.string({ message: 'Question text is required' }),
    options: z.array(z.string()).min(2, 'At least 2 options are required'),
    correctAnswer: z.number(),
    explanation: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    marks: z.number().optional(),
    negativeMarks: z.number().optional(),
  }),
});

export const updateQuestionSchema = z.object({
  body: z.object({
    question: z.string().optional(),
    options: z.array(z.string()).min(2).optional(),
    correctAnswer: z.number().optional(),
    explanation: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    marks: z.number().optional(),
    negativeMarks: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const submitQuizSchema = z.object({
  body: z.object({
    attemptId: z.string({ message: 'Attempt ID is required' }),
    answers: z.record(z.string(), z.number()), // Updated to 2 arguments to satisfy strict type checkers
  }),
});
