import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import errorHandler from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import chapterRoutes from './modules/chapter/chapter.routes';
import lessonRoutes from './modules/lesson/lesson.routes';
import quizRoutes from './modules/quiz/quiz.routes';
import progressRoutes from './modules/progress/progress.routes';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// --- SECURITY MIDDLEWARES ---
app.use(helmet());
app.use(mongoSanitize());

// CORS configuration
app.use(
    cors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', limiter);

// --- ROUTES ---
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to MedCodePro Learning API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/progress', progressRoutes);

// Admin Specific Mounting (to match exact requirements if needed)
app.use('/api/admin/chapters', chapterRoutes);
app.use('/api/admin/lessons', lessonRoutes);
app.use('/api/admin/quizzes', quizRoutes);
app.use('/api/admin/questions', quizRoutes);

// --- ERROR HANDLING ---
app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000');

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err: any) => {
    console.log(`❌ Error: ${err.message}`);
    server.close(() => process.exit(1));
});
