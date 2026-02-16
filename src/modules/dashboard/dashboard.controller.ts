import { Request, Response, NextFunction } from 'express';
import Chapter from '../../models/chapter.model';
import Lesson from '../../models/lesson.model';
import Progress from '../../models/progress.model';
import QuizAttempt from '../../models/quizAttempt.model';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getDashboardOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id;

    const totalChapters = await Chapter.countDocuments({ isPublished: true });
    
    // Aggregate data from Progress
    const allProgress = await Progress.find({ userId });
    
    let totalLessonsCompleted = 0;
    let totalPercentage = 0;
    let totalQuizPercentage = 0;
    let quizCount = 0;

    allProgress.forEach(p => {
      totalLessonsCompleted += p.completedLessons.length;
      totalPercentage += p.percentage;
      if (p.quizPercentage > 0) {
        totalQuizPercentage += p.quizPercentage;
        quizCount++;
      }
    });

    const overallProgress = allProgress.length > 0 ? totalPercentage / totalChapters : 0;
    const quizAverage = quizCount > 0 ? (totalQuizPercentage / quizCount) : 0;

    // Recent Activity (last 5 attempts or lesson completions)
    const recentActivity = await QuizAttempt.find({ userId })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('quizId', 'title');

    res.status(200).json({
      success: true,
      user: {
        name: req.user?.name,
      },
      data: {
        totalChapters,
        totalLessonsCompleted,
        overallProgress: Math.min(overallProgress, 100),
        quizAverage,
        quizCount,
        recentActivity,
        xp: req.user?.xp || 0,
        level: req.user?.level || 1,
        rank: req.user?.rank || 'Novice Coder'
      }
    });
  } catch (error) {
    next(error);
  }
};
