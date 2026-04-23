import { Router } from 'express';
import { sendNotification, getNotificationHistory, sendValidation } from './adminNotifications.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.post('/send', authenticateAdmin, sendValidation, sendNotification);
router.get('/history', authenticateAdmin, getNotificationHistory);

export default router;
