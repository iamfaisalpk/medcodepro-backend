import express from 'express';
import { 
  createQuiz, 
  updateQuiz,
  deleteQuiz,
  createQuestion, 
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
  getAdminQuizAnalytics,
  getAllAttempts,
  getAllQuestions,
  getQuizQuestionsForAdmin,
  getQuizzes,
  startQuiz,
  submitQuiz,
  getLeaderboard
} from './quiz.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadPDF } from '../../middleware/upload.middleware';
import { 
  createQuizSchema, 
  createQuestionSchema, 
  updateQuestionSchema,
  submitQuizSchema 
} from './quiz.validation';

const router = express.Router();

// --- Public / Shared Routes ---
router.get('/', protect, getQuizzes);
router.get('/leaderboard', protect, getLeaderboard);

// --- Student Routes ---
router.post('/:id/start', protect, startQuiz);
router.post('/submit', protect, validate(submitQuizSchema), submitQuiz);

// --- Admin Routes ---
router.post('/create-quiz', protect, authorize('admin'), validate(createQuizSchema), createQuiz);
router.patch('/quiz/:id', protect, authorize('admin'), updateQuiz);
router.delete('/quiz/:id', protect, authorize('admin'), deleteQuiz);

router.get('/questions/all', protect, authorize('admin'), getAllQuestions);
router.get('/:quizId/questions', protect, authorize('admin'), getQuizQuestionsForAdmin);

router.post('/create-question', protect, authorize('admin'), validate(createQuestionSchema), createQuestion);
router.patch('/question/:id', protect, authorize('admin'), validate(updateQuestionSchema), updateQuestion);
router.delete('/question/:id', protect, authorize('admin'), deleteQuestion);
router.post('/bulk-upload', protect, authorize('admin'), uploadPDF.single('file'), bulkUploadQuestions);

router.get('/analytics/overview', protect, authorize('admin'), getAdminQuizAnalytics);
router.get('/attempts/all', protect, authorize('admin'), getAllAttempts);

export default router;
