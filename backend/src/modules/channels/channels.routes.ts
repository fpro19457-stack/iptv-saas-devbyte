import { Router } from 'express';
import { listChannels, getStream } from './channels.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.get('/', authenticate, listChannels);
router.get('/:id/stream', authenticate, getStream);

export default router;
