import express from 'express';
import { getCourses, getCourseDetails, getLesson } from './learning.controller';
import { protect } from '../../middleware/auth.middleware';

const router = express.Router();

router.get('/courses', protect, getCourses);
router.get('/courses/:id', protect, getCourseDetails);
router.get('/lessons/:id', protect, getLesson);

export default router;
