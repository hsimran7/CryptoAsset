import express from 'express';
import { getPDFData, downloadCSV, getReportHistory } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/pdf',     getPDFData);       // GET /api/reports/pdf     → returns JSON for client-side PDF generation
router.get('/csv',     downloadCSV);      // GET /api/reports/csv     → streams .csv file download
router.get('/history', getReportHistory); // GET /api/reports/history → report generation log

export default router;
