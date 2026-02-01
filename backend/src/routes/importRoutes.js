import express from 'express';
import multer from 'multer';
import { bulkImportStudents, bulkImportQuestions } from '../controllers/importController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin only routes
router.post('/students', authenticate, authorize('admin'), upload.single('file'), bulkImportStudents);
router.post('/questions', authenticate, authorize('admin'), upload.single('file'), bulkImportQuestions);

export default router;
