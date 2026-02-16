import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  completedLessons: mongoose.Types.ObjectId[];
  quizScore: number;
  quizPercentage: number;
  percentage: number;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    quizScore: { type: Number, default: 0 },
    quizPercentage: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index to ensure unique progress per user per chapter
progressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

export default mongoose.model<IProgress>('Progress', progressSchema);
