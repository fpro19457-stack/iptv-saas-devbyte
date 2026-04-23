import { Router } from 'express';
import { approvePairing, getPendingPairings } from './pairing.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.post('/approve', authenticateAdmin, approvePairing);
router.get('/pending', authenticateAdmin, getPendingPairings);

export default router;