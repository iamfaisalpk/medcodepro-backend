import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IOTP extends Document {
    email: string;
    otp: string;
    createdAt: Date;
    compareOTP(enteredOTP: string): Promise<boolean>;
}

const otpSchema = new Schema<IOTP>({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600, // 10 minutes
    },
});

otpSchema.pre<IOTP>('save', async function (next) {
    if (!this.isModified('otp')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
});

otpSchema.methods.compareOTP = async function (enteredOTP: string): Promise<boolean> {
    return await bcrypt.compare(enteredOTP, this.otp);
};

export default mongoose.model<IOTP>('OTP', otpSchema);
