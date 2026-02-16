import express from 'express';
import {
    register,
    verifyOTP,
    login,
    forgotPassword,
    resetPassword,
    refresh,
    logout,
    getMe,
    getUsers,
    updateProfile,
    updatePassword
} from '../controllers/auth.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, updatePassword);
router.get('/users', protect, authorize('admin'), getUsers);

export default router;
