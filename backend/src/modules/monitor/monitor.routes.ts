import { Router } from 'express';
import { getMonitorStatus, getIncidents, getMonitorConfig, updateMonitorConfig, runMonitorCycle, checkSingleChannel } from './monitor.service';
import { authenticateAdmin } from '../../middlewares/authenticateAdmin';

const router = Router();

router.get('/status', authenticateAdmin, async (req, res) => {
  try {
    const status = await getMonitorStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error getting monitor status' });
  }
});

router.get('/incidents', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getIncidents(page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error getting incidents' });
  }
});

router.get('/config', authenticateAdmin, async (req, res) => {
  try {
    const config = await getMonitorConfig();
    const { telegramToken, telegramChatId, ...rest } = config as any;
    res.json({
      success: true,
      data: {
        ...rest,
        hasTelegram: !!(telegramToken && telegramChatId),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error getting config' });
  }
});

router.put('/config', authenticateAdmin, async (req, res) => {
  try {
    const config = await updateMonitorConfig(req.body);
    res.json({ success: true, data: config, message: 'Configuración actualizada' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating config' });
  }
});

router.post('/check-now', authenticateAdmin, async (req, res) => {
  try {
    const result = await runMonitorCycle();
    res.json({ success: true, data: result, message: 'Verificación completada' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error running check' });
  }
});

router.post('/check-channel', authenticateAdmin, async (req, res) => {
  try {
    const { channelId } = req.body;
    if (!channelId) {
      return res.status(400).json({ success: false, message: 'Channel ID required' });
    }
    const result = await checkSingleChannel(channelId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error checking channel' });
  }
});

export default router;