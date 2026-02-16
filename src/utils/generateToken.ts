import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const generateAccessToken = (id: mongoose.Types.ObjectId, role: string): string => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret_123', {
        expiresIn: '1h', // Increased slightly for better UX in dev
    });
};

export const generateRefreshToken = (id: mongoose.Types.ObjectId): string => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_123', {
        expiresIn: '7d',
    });
};
