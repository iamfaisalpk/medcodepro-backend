import mongoose, { Document, Schema } from 'mongoose';

export interface IQuiz extends Document {
  chapterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  timeLimit: number;
  totalMarks: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    title: { type: String, required: true },
    description: { type: String },
    timeLimit: { type: Number, default: 0 }, // in minutes
    totalMarks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IQuiz>('Quiz', quizSchema);
