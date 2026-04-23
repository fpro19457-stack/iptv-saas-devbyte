import { Router } from 'express';
import { login, logout, me, loginValidation } from './adminAuth.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';
import { loginLimiter } from '../../../middlewares/rateLimiter';

const router = Router();

router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', authenticateAdmin, logout);
router.get('/me', authenticateAdmin, me);

export default router;
