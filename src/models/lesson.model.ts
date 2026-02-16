import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  chapterId: mongoose.Types.ObjectId;
  title: string;
  videoUrl: string;
  notes: string;
  duration: number;
  order: number;
  isPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    title: { type: String, required: true },
    videoUrl: { type: String },
    notes: { type: String }, // HTML or markdown
    duration: { type: Number },
    order: { type: Number, required: true },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ILesson>('Lesson', lessonSchema);
