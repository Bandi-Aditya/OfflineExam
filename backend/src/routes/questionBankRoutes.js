import express from 'express';
import { getAllQuestions, deleteQuestionHelper } from '../controllers/questionBankController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getAllQuestions);
router.delete('/:id', authenticate, authorize('admin'), deleteQuestionHelper);

export default router;
