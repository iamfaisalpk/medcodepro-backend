import express from 'express';
import { getDashboardOverview } from './dashboard.controller';
import { protect } from '../../middleware/auth.middleware';

const router = express.Router();

router.get('/overview', protect, getDashboardOverview);

export default router;
