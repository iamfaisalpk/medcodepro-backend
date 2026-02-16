import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Lesson from '../../models/lesson.model';

export const createLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

export const getChapterLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.chapterId as string)) {
      return res.status(400).json({ success: false, error: 'Invalid Chapter ID format' });
    }
    const lessons = await Lesson.find({ chapterId: req.params.chapterId as string }).sort('order');
    res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    next(error);
  }
};

export const getLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      return res.status(400).json({ success: false, error: 'Invalid Lesson ID format' });
    }
    const lesson = await Lesson.findById(req.params.id as string);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }
    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};
