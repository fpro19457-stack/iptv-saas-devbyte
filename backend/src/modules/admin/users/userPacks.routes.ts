import { Router } from 'express';
import { assignPack, removePack, getUserPacks, replaceUserPacks } from './userPacks.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.post('/:id/packs', authenticateAdmin, assignPack);
router.put('/:id/packs', authenticateAdmin, replaceUserPacks);
router.delete('/:id/packs/:packId', authenticateAdmin, removePack);
router.get('/:id/packs', authenticateAdmin, getUserPacks);

export default router;
