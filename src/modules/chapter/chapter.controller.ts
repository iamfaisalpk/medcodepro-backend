import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Chapter from '../../models/chapter.model';

export const createChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chapter = await Chapter.create(req.body);
    res.status(201).json({ success: true, data: chapter });
  } catch (error) {
    next(error);
  }
};

export const getChapters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chapters = await Chapter.find().sort('order');
    res.status(200).json({ success: true, data: chapters });
  } catch (error) {
    next(error);
  }
};

export const getChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      return res.status(400).json({ success: false, error: 'Invalid Chapter ID format' });
    }
    const chapter = await Chapter.findById(req.params.id as string);
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }
    res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      return res.status(400).json({ success: false, error: 'Invalid Chapter ID format' });
    }
    const chapter = await Chapter.findByIdAndUpdate(req.params.id as string, req.body, {
      new: true,
      runValidators: true,
    });
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }
    res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      return res.status(400).json({ success: false, error: 'Invalid Chapter ID format' });
    }
    const chapter = await Chapter.findByIdAndDelete(req.params.id as string);
    if (!chapter) {
      return res.status(404).json({ success: false, error: 'Chapter not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
