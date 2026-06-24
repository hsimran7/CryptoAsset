import express from 'express';
import {
  getAlertRules,
  createAlert,
  toggleAlert,
  deleteAlert
} from '../controllers/alertsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware to all alert endpoints
router.use(protect);

router.get('/', getAlertRules);
router.post('/', createAlert);
router.patch('/:id/toggle', toggleAlert);
router.delete('/:id', deleteAlert);

export default router;
