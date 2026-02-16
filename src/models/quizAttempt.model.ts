import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  questions: {
    questionId: mongoose.Types.ObjectId;
    selectedAnswer: number;
    isCorrect: boolean;
    marksAwarded: number;
    explanation: string;
  }[];
  score: number;
  totalMarks: number;
  percentage: number;
  status: 'started' | 'completed';
  startedAt: Date;
  completedAt: Date;
  timeTaken: number; // in seconds
  ipAddress: string;
  deviceInfo: string;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
    questions: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
        selectedAnswer: { type: Number },
        isCorrect: { type: Boolean },
        marksAwarded: { type: Number },
        explanation: { type: String }
      }
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['started', 'completed'], 
      default: 'started' 
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeTaken: { type: Number },
    ipAddress: { type: String },
    deviceInfo: { type: String },
  },
  { timestamps: true }
);

// Add indexes for performance
quizAttemptSchema.index({ userId: 1 });
quizAttemptSchema.index({ quizId: 1 });
quizAttemptSchema.index({ startedAt: -1 });
quizAttemptSchema.index({ status: 1 });

export default mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
