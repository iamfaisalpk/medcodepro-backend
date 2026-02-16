import { Request, Response, NextFunction } from 'express';
import Course from '../../models/course.model';
import Chapter from '../../models/chapter.model';
import Lesson from '../../models/lesson.model';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const courses = await Course.find({ published: true });
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        next(error);
    }
};

export const getCourseDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const chapters = await Chapter.find({ course: id }).sort('order');
        
        const courseData = await Promise.all(chapters.map(async (chapter) => {
            const lessons = await Lesson.find({ chapter: chapter._id }).sort('order');
            return {
                ...chapter.toObject(),
                lessons
            };
        }));

        res.status(200).json({ success: true, data: courseData });
    } catch (error) {
        next(error);
    }
};

export const getLesson = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const lesson = await Lesson.findById(id).populate('chapter');
        if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

        res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        next(error);
    }
};
