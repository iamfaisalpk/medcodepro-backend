import { Request, Response, NextFunction } from 'express';
import Quiz from '../../models/quiz.model';
import Question from '../../models/question.model';
import QuizAttempt from '../../models/quizAttempt.model';
import Progress from '../../models/progress.model';
import { AuthRequest } from '../../middleware/auth.middleware';
import User from '../../models/user.model';
import mongoose from 'mongoose';
const pdfParse = require('pdf-parse') as any;

// --- ADMIN CONTROLLERS ---

export const createQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await Quiz.create(req.body);
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

export const updateQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });
    // Also delete associated questions
    await Question.deleteMany({ quizId: req.params.id });
    res.status(200).json({ success: true, message: 'Quiz and associated questions deleted' });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!question) return res.status(404).json({ success: false, error: 'Question not found' });
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, error: 'Question not found' });
    res.status(200).json({ success: true, message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file;
    const { chapterId, quizId } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    if (!chapterId) {
      return res.status(400).json({ success: false, error: 'Chapter ID is required' });
    }

    // Treat empty string quizId as undefined/null
    const targetQuizId = quizId && quizId.trim() !== '' ? quizId : undefined;

    // Parse PDF
    let text = '';
    try {
      if (typeof pdfParse === 'function') {
        // Legacy/standard pdf-parse API
        const pdfData = await pdfParse(file.buffer);
        text = pdfData.text;
      } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
        // Mehmet Kozan's pdf-parse (v2.4.5+) API
        const parser = new (pdfParse as any).PDFParse({ data: file.buffer });
        const result = await parser.getText();
        text = result.text;
      } else if (pdfParse && pdfParse.default && typeof pdfParse.default === 'function') {
        // ESM wrapped legacy API
        const pdfData = await pdfParse.default(file.buffer);
        text = pdfData.text;
      } else {
        // Attempt to use as constructor directly if it's the class itself
        try {
          const parser = new (pdfParse as any)({ data: file.buffer });
          const result = await parser.getText();
          text = result.text;
        } catch (e) {
          throw new Error('pdfParse is not a function or a compatible class. Please check the library installation.');
        }
      }
    } catch (error: any) {
      console.error('PDF Parsing Error:', error);
      return res.status(error.code || 500).json({ 
        message: 'Failed to parse PDF file' + (error.message ? `: ${error.message}` : ''),
        error: error.toString()
      });
    }
    
    console.log('PDF Extracted Text Sample (First 500 chars):', text.substring(0, 500));

    // Parse questions from PDF text
    const questions = parsePDFQuestions(text, chapterId, targetQuizId);
    
    console.log(`Parsed ${questions.length} questions from PDF`);

    if (questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid questions found. Ensure format: "1. Question text" followed by "A. Option" etc.' 
      });
    }

    // Validate and insert questions
    const validQuestions = questions.filter(q => 
      q.question && 
      q.options.length >= 2 && 
      q.correctAnswer >= 0 && 
      q.correctAnswer < q.options.length
    );

    if (validQuestions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Found ' + questions.length + ' potential questions but none were valid (missing options or correct answer).' 
      });
    }

    const createdQuestions = await Question.insertMany(validQuestions);
    
    res.status(201).json({ 
      success: true, 
      data: {
        count: createdQuestions.length,
        total: questions.length,
        skipped: questions.length - validQuestions.length
      }
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    next(error);
  }
};

// Helper function to parse PDF text into questions
function parsePDFQuestions(text: string, chapterId: string, quizId: string | undefined): any[] {
  const questions: any[] = [];
  
  // Normalize text: remove carriage returns, normalize ALL whitespace to standard space
  const cleanText = text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ') // Replace control characters with space
    .replace(/\s+/g, ' ')                        // Normalize all whitespace to single space
    .trim();
  
  console.log('--- PDF PARSING DEBUG START ---');
  console.log('Total clean text length:', cleanText.length);

  // Strategy 1: Numeric split (1. 2. 3. or 1) 2) 3))
  let questionBlocks = cleanText.split(/\s*(?:\d+[\.\)\-\/\:][\s]*|Q\d+[\.\)\-\/\:][\s]*|Question\s*\d+[\.\)\-\/\:]*[\s]*)/i);
  
  // Strategy 2: If numeric split failed (found 0 or 1 block), try splitting by bullets
  if (questionBlocks.length <= 1) {
    console.log('Numeric split failed, trying bullet split...');
    questionBlocks = cleanText.split(/\s*(?:\u2022|\*|\u25CF|\u25CB)\s*/);
  }

  // Strategy 3: If still failed, try common "Question" text
  if (questionBlocks.length <= 1) {
    console.log('Bullet split failed, trying "Question" keyword split...');
    questionBlocks = cleanText.split(/\s*Question\s*\:?\s*/i);
  }

  console.log('Final Question Blocks Found:', questionBlocks.length);

  const header = questionBlocks.shift(); // Remove text before first question

  questionBlocks.forEach((block, index) => {
    if (block.length < 15) return;

    // Inside each block: Question Text + Options + Answer
    
    // 1. Identify Answer (looks for A, B, C, or D)
    const answerMatch = block.match(/(?:Correct\s*)?Answer\s*\:?\s*([A-D])/i);
    let correctAnswer = 0;
    if (answerMatch) {
      correctAnswer = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
    } else {
      // Fallback: Check if any option has an asterisk * (legacy format)
      const starMatch = block.match(/([A-D])(?:\.)?\s+[^\*]+\*/i);
      if (starMatch) {
         correctAnswer = starMatch[1].toUpperCase().charCodeAt(0) - 65;
      }
    }

    // 2. Extract Options
    // Split block by option labels (A., B., C., D.)
    const options: string[] = [];
    const parts = block.split(/\s*(?:\u2022|\*|\-|\d+\.)?\s*(?:\()?[A-D](?:[\.\)\-\:\s])(?:\))?\s+/i);
    
    const questionText = parts[0].trim();
    
    for (let i = 1; i < parts.length && i <= 4; i++) {
      let optionContent = parts[i].trim();
      // Remove Answer string from the end of the option
      optionContent = optionContent.split(/(?:Correct\s*)?Answer\s*\:/i)[0].trim();
      if (optionContent) options.push(optionContent);
    }

    if (questionText.length > 5 && options.length >= 2) {
      questions.push({
        quizId,
        chapterId,
        question: questionText,
        options: options.slice(0, 4),
        correctAnswer: correctAnswer >= 0 && correctAnswer < options.length ? correctAnswer : 0,
        difficulty: 'medium',
        marks: 1,
        explanation: '',
        isActive: true
      });
    }
  });
  
  console.log('Successfully extracted questions:', questions.length);
  console.log('--- PDF PARSING DEBUG END ---');
  
  return questions;
}

export const getAdminQuizAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await Question.aggregate([
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          activeQuestions: { $sum: { $cond: ["$isActive", 1, 0] } },
          difficultySplit: {
            $push: "$difficulty"
          },
          chapterSplit: {
            $push: "$chapterId"
          }
        }
      }
    ]);

    const attemptsStats = await QuizAttempt.aggregate([
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: "$percentage" },
          maxScore: { $max: "$percentage" }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: { 
        questions: stats[0] || {}, 
        attempts: attemptsStats[0] || {} 
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAttempts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, quizId, status } = req.query;
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (quizId) filter.quizId = quizId;
    if (status) filter.status = status;

    const attempts = await QuizAttempt.find(filter)
      .populate('userId', 'name email')
      .populate('quizId', 'title')
      .sort('-createdAt');
    
    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    next(error);
  }
};

export const getAllQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await Question.find()
      .select('+correctAnswer') // Admin needs to see answers
      .populate('quizId', 'title')
      .populate('chapterId', 'title')
      .sort('-createdAt');
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

export const getQuizQuestionsForAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await Question.find({ quizId: req.params.quizId })
      .select('+correctAnswer') // Admin needs to see correct answers
      .sort('createdAt');
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

// --- STUDENT CONTROLLERS ---

export const getQuizzes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quizzes = await Quiz.find().sort('-createdAt').lean();
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    next(error);
  }
};

export const startQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const quizId = req.params.id;
    const userId = req.user?._id;

    // Check if there is an active (uncompleted) attempt for this user and quiz
    const activeAttempt = await QuizAttempt.findOne({ userId, quizId, status: 'started' });
    if (activeAttempt) {
      // In production, you might want to resume it or force submission
      // For now, let's return the existing one or handle as error
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    // Randomly select active questions
    // Priority 1: Questions specifically linked to this quiz
    let questions: any[] = await Question.find({ quizId, isActive: true }).select('-correctAnswer') as any;
    
    // Priority 2: Fallback to Chapter questions if Quiz is empty (handles bulk uploads to general pool)
    if (questions.length === 0 && quiz.chapterId) {
      console.log(`No questions found for quiz ${quizId}. Falling back to chapter ${quiz.chapterId} pool.`);
      questions = await Question.find({ 
        chapterId: quiz.chapterId, 
        isActive: true,
        $or: [{ quizId: { $exists: false } }, { quizId: null }]
      }).select('-correctAnswer') as any;
    }
    
    // Shuffle questions
    questions = questions.sort(() => Math.random() - 0.5);

    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      status: 'started',
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'] || 'Unknown',
      startedAt: new Date(),
    });

    res.status(200).json({ 
      success: true, 
      data: { 
        attemptId: attempt._id,
        quiz: {
          title: quiz.title,
          description: quiz.description,
          timeLimit: quiz.timeLimit
        },
        questions 
      } 
    });
  } catch (error) {
    next(error);
  }
};

export const submitQuiz = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { answers, attemptId } = req.body;
    const userId = req.user?._id;

    const attempt = await QuizAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt record not found' });
    if (attempt.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Quiz already submitted' });
    }

    const quizId = attempt.quizId;
    const quiz = await Quiz.findById(quizId);

    // Fetch questions with correct answers and explanations
    let questions: any[] = await Question.find({ quizId, isActive: true }).select('+correctAnswer').lean() as any;

    // Fallback to chapter pool if quiz is empty (to match startQuiz behavior)
    if (questions.length === 0 && quiz && quiz.chapterId) {
      questions = await Question.find({ 
        chapterId: quiz.chapterId, 
        isActive: true,
        $or: [{ quizId: { $exists: false } }, { quizId: null }]
      }).select('+correctAnswer').lean();
    }
    
    let totalScore = 0;
    let totalPossibleMarks = 0;
    const trackedQuestions = [];

    // answers is expected to be an object or array mapping questionId to selected option index
    // Let's assume an array where index matches the question index in sorted order or matching ID
    
    for (const q of questions) {
      const selectedIndex = answers[q._id.toString()];
      const isCorrect = selectedIndex === q.correctAnswer;
      const marksAwarded = isCorrect ? q.marks : (q.negativeMarks || 0) * -1;
      
      totalScore += marksAwarded;
      totalPossibleMarks += q.marks;

      trackedQuestions.push({
        questionId: q._id,
        selectedAnswer: selectedIndex,
        isCorrect,
        marksAwarded,
        explanation: q.explanation
      });
    }

    const finalPercentage = (totalScore / totalPossibleMarks) * 100;
    const timeTaken = Math.floor((new Date().getTime() - new Date(attempt.startedAt).getTime()) / 1000);

    attempt.status = 'completed';
    attempt.completedAt = new Date();
    attempt.score = totalScore;
    attempt.totalMarks = totalPossibleMarks;
    attempt.percentage = finalPercentage;
    attempt.timeTaken = timeTaken;
    attempt.questions = trackedQuestions as any;

    await attempt.save();

    // Update Overall Progress
    await Progress.findOneAndUpdate(
      { userId, chapterId: quiz?.chapterId },
      { 
        $max: { quizScore: totalScore, quizPercentage: finalPercentage }, 
        percentage: 100, 
        lastAccessed: new Date() 
      },
      { upsert: true }
    );

    // --- GAMIFICATION: XP & RANK SYSTEM ---
    const earnedXp = (totalScore * 10) + 50; // 10 XP per mark + 50 completion bonus
    const user = await User.findById(userId);
    
    if (user) {
      user.xp += earnedXp;
      
      // Level Calculation (Every 1000 XP = 1 Level)
      const newLevel = Math.floor(user.xp / 1000) + 1;
      
      if (newLevel > user.level) {
        user.level = newLevel;
      }
      
      // Rank Calculation based on Level
      const ranks = [
        { minLevel: 0, title: 'Novice Coder' },
        { minLevel: 10, title: 'Coding Analyst' },
        { minLevel: 25, title: 'Certified Auditor' },
        { minLevel: 50, title: 'Compliance Master' },
        { minLevel: 100, title: 'MedCode Legend' }
      ];
      
      const currentRank = ranks.reverse().find(r => user.level >= r.minLevel);
      if (currentRank) {
        user.rank = currentRank.title;
      }
      
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        score: totalScore,
        total: totalPossibleMarks,
        percentage: finalPercentage,
        timeTaken,
        results: trackedQuestions // Now contains explanations
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await QuizAttempt.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: "$userId",
          avgScore: { $avg: "$percentage" },
          bestScore: { $max: "$percentage" },
          totalQuizzes: { $sum: 1 }
        }
      },
      { $sort: { bestScore: -1, avgScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          name: "$userDetails.name",
          bestScore: 1,
          avgScore: 1,
          totalQuizzes: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
};
