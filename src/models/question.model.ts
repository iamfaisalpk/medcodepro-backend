import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  quizId?: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: false },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true, select: false },
    explanation: { type: String },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'], 
      default: 'medium' 
    },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Add indexes for performance
questionSchema.index({ quizId: 1 });
questionSchema.index({ chapterId: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ isActive: 1 });

export default mongoose.model<IQuestion>('Question', questionSchema);
