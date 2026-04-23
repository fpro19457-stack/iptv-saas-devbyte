import { Router } from 'express';
import {
  listPacks,
  createPack,
  updatePack,
  deletePack,
  assignChannels,
  removeChannel,
  createValidation,
} from './adminPacks.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.get('/', authenticateAdmin, listPacks);
router.post('/', authenticateAdmin, createValidation, createPack);
router.put('/:id', authenticateAdmin, updatePack);
router.delete('/:id', authenticateAdmin, deletePack);
router.post('/:id/channels', authenticateAdmin, assignChannels);
router.delete('/:id/channels/:channelId', authenticateAdmin, removeChannel);

export default router;
