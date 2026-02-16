import mongoose, { Document, Schema } from 'mongoose';

export interface IChapter extends Document {
  title: string;
  codeRange: string;
  description: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true },
    codeRange: { type: String },
    description: { type: String },
    order: { type: Number, required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IChapter>('Chapter', chapterSchema);
