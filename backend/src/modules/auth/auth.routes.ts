import { Router } from 'express';
import { login, logout, refresh, me, loginValidation, updatePreferences } from './auth.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.post('/login', loginValidation, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);
router.patch('/preferences', authenticate, updatePreferences);

export default router;
