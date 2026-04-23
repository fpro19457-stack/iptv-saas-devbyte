import { Router } from 'express';
import {
  listChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  toggleChannel,
  reorderChannels,
  getCategories,
  importM3u,
  bulkDeleteChannels,
  listValidation,
  createValidation,
} from './adminChannels.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.get('/', authenticateAdmin, listValidation, listChannels);
router.get('/categories', authenticateAdmin, getCategories);
router.post('/', authenticateAdmin, createValidation, createChannel);
router.post('/import-m3u', authenticateAdmin, importM3u);
router.post('/bulk-delete', authenticateAdmin, bulkDeleteChannels);
router.put('/:id', authenticateAdmin, updateChannel);
router.delete('/:id', authenticateAdmin, deleteChannel);
router.patch('/:id/toggle', authenticateAdmin, toggleChannel);
router.patch('/reorder', authenticateAdmin, reorderChannels);

export default router;
