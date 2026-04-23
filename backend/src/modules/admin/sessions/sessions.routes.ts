import { Router } from 'express';
import { getLiveSessions, forceCloseSession } from './sessions.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.get('/live', authenticateAdmin, getLiveSessions);
router.delete('/:id', authenticateAdmin, forceCloseSession);

export default router;
