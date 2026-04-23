import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from './notifications.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markAsRead);
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
