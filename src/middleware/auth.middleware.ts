import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

// Extend Express Request to include user
export interface AuthRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_123') as { id: string };
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'No user found with this id',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route',
        });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user?.role} is not authorized to access this route`,
            });
        }
        next();
    };
};
