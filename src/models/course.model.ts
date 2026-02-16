import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    instructor: mongoose.Types.ObjectId;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        thumbnail: { type: String, default: 'default_course.jpg' },
        category: { type: String, required: true },
        instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        published: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<ICourse>('Course', courseSchema);
