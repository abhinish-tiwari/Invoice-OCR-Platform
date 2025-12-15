import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import healthCheck from '../utils/health.check.utils';

const router = Router();
router.use('/health', healthCheck);
router.use('/auth', authRoutes);

export default router;