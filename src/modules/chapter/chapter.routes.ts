import express from 'express';
import { 
  createChapter, 
  getChapters, 
  getChapter, 
  updateChapter, 
  deleteChapter 
} from './chapter.controller';
import { getChapterLessons } from '../lesson/lesson.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createChapterSchema, updateChapterSchema } from './chapter.validation';

const router = express.Router();

// Student Routes
router.get('/', protect, getChapters);
router.get('/:id', protect, getChapter);
router.get('/:chapterId/lessons', protect, getChapterLessons);

// Admin Routes
router.post('/', protect, authorize('admin'), validate(createChapterSchema), createChapter);
router.put('/:id', protect, authorize('admin'), validate(updateChapterSchema), updateChapter);
router.delete('/:id', protect, authorize('admin'), deleteChapter);

export default router;
