import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    role: 'student' | 'admin';
    xp: number;
    level: number;
    rank: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'Please provide your name'],
            trim: true,
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            default: 'student',
        },
        xp: {
            type: Number,
            default: 0,
        },
        level: {
            type: Number,
            default: 1,
        },
        rank: {
            type: String,
            default: 'Novice Coder',
        }
    },
    {
        timestamps: true,
    }
);

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
