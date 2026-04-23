import { Router } from 'express';
import { getMetrics } from './metrics.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.get('/', authenticateAdmin, getMetrics);

export default router;
