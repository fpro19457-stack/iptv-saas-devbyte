import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  changeStatus,
  deleteUser,
  getUserSessions,
  closeSession,
  closeAllSessions,
  listValidation,
  createValidation,
} from './adminUsers.controller';
import { authenticateAdmin } from '../../../middlewares/authenticateAdmin';

const router = Router();

router.get('/', authenticateAdmin, listValidation, listUsers);
router.get('/:id', authenticateAdmin, getUser);
router.post('/', authenticateAdmin, createValidation, createUser);
router.put('/:id', authenticateAdmin, updateUser);
router.patch('/:id/status', authenticateAdmin, changeStatus);
router.delete('/:id', authenticateAdmin, deleteUser);
router.get('/:id/sessions', authenticateAdmin, getUserSessions);
router.delete('/:id/sessions/:sessionId', authenticateAdmin, closeSession);
router.delete('/:id/sessions', authenticateAdmin, closeAllSessions);

export default router;
