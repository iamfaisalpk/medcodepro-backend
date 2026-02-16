import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import OTP from '../models/otp.model';
import { generateOTP } from '../utils/otp';
import { sendEmail } from '../config/mail';
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const otpCode = generateOTP();
        await OTP.create({ email, otp: otpCode });

        const user = await User.create({ name, email, password, isVerified: false, role: 'student' });

        const message = `Your verification code for MedCodePro is ${otpCode}.`;
        
        try {
            await sendEmail({
                email,
                subject: 'Email Verification - MedCodePro',
                message,
                html: `<h1>Verify Your Email</h1><p>${message}</p>`,
            });

            res.status(200).json({
                success: true,
                message: 'OTP sent to email. Please verify to complete registration.',
            });
        } catch (emailError) {
            if (process.env.NODE_ENV === 'development') {
                return res.status(201).json({
                    success: true,
                    message: 'User created (Dev Mode: OTP below)',
                    otp: otpCode,
                });
            }
            res.status(201).json({
                success: true,
                message: 'User created, but email failed. Please contact support.',
            });
        }
    } catch (error) {
        next(error);
    }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;
        const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, error: 'OTP expired or not found' });
        }

        const isMatch = await otpRecord.compareOTP(otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'Invalid OTP' });
        }

        const user = await User.findOne({ email });
        if (user) {
            user.isVerified = true;
            await user.save();
        }

        await OTP.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ success: false, error: 'Please verify your email first' });
        }

        const accessToken = generateAccessToken(user._id as any, user.role);
        const refreshToken = generateRefreshToken(user._id as any);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            token: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ success: false, error: 'Not authenticated' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret_123') as { id: string };
        const user = await User.findById(decoded.id);

        if (!user) return res.status(401).json({ success: false, error: 'User not found' });

        const newAccessToken = generateAccessToken(user._id as any, user.role);
        res.status(200).json({
            success: true,
            token: newAccessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const otpCode = generateOTP();
        await OTP.create({ email, otp: otpCode });

        const message = `Your password reset code is ${otpCode}.`;
        await sendEmail({ email, subject: 'Password Reset', message });

        res.status(200).json({ success: true, message: 'OTP sent to email.' });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp, newPassword } = req.body;
        const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

        if (!otpRecord || !(await otpRecord.compareOTP(otp))) {
            return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ email });
        if (user) {
            user.password = newPassword;
            await user.save();
        }

        await OTP.deleteOne({ _id: otpRecord._id });
        res.status(200).json({ success: true, message: 'Password reset successful.' });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: AuthRequest, res: Response) => {
    res.status(200).json({ success: true, user: req.user });
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user?._id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user?._id).select('+password');

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ success: false, error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};
