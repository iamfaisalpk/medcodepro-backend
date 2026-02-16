import express from 'express';
import { createLesson, getChapterLessons, getLesson } from './lesson.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createLessonSchema } from './lesson.validation';

const router = express.Router();

// Public/Student Routes
router.get('/:id', protect, getLesson);
router.get('/chapter/:chapterId', protect, getChapterLessons);

// Admin Routes
router.post('/', protect, authorize('admin'), validate(createLessonSchema), createLesson);

export default router;
