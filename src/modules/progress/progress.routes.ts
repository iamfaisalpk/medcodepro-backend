import express from 'express';
import { completeLesson, getProgress } from './progress.controller';
import { protect } from '../../middleware/auth.middleware';

const router = express.Router();

router.post('/complete-lesson', protect, completeLesson);
router.get('/', protect, getProgress);

export default router;
