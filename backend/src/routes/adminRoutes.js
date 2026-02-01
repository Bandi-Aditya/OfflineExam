import express from 'express';
import multer from 'multer';
import {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    uploadExam,
    generateExamFromBank
} from '../controllers/examController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Exam routes
router.post('/exams/auto-generate', generateExamFromBank);
router.post('/exams/upload', multer({ storage: multer.memoryStorage() }).single('file'), uploadExam);
router.post('/exams', createExam);
router.get('/exams', getAllExams);
router.get('/exams/:id', getExamById);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

// Question routes
router.post('/exams/:examId/questions', addQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

export default router;
