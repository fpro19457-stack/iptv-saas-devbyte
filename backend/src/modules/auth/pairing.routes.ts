import { Router } from 'express';
import { generatePairingCode, getPairingStatus } from './pairing.controller';

const router = Router();

router.post('/pairing/generate', generatePairingCode);
router.get('/pairing/status/:code', getPairingStatus);

export default router;