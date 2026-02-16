import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Progress from '../../models/progress.model';
import Lesson from '../../models/lesson.model';
import Chapter from '../../models/chapter.model';
import { AuthRequest } from '../../middleware/auth.middleware';

export const completeLesson = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.body;
    const userId = req.user?._id;

    if (!mongoose.Types.ObjectId.isValid(lessonId as string)) {
      return res.status(400).json({ success: false, error: 'Invalid Lesson ID format' });
    }

    const lesson = await Lesson.findById(lessonId as string);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    const chapterId = lesson.chapterId;

    let progress = await Progress.findOne({ userId, chapterId });

    if (!progress) {
      progress = new Progress({
        userId,
        chapterId,
        completedLessons: [lessonId],
      });
    } else {
      if (!progress.completedLessons.includes(lessonId as any)) {
        progress.completedLessons.push(lessonId as any);
      }
    }

    // Calculate percentage based on total lessons in chapter
    const totalLessons = await Lesson.countDocuments({ chapterId });
    progress.percentage = (progress.completedLessons.length / totalLessons) * 100;
    progress.lastAccessed = new Date();

    await progress.save();

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

export const getProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const progress = await Progress.find({ userId: req.user?._id }).populate('chapterId', 'title');
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};
