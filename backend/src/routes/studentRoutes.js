import express from 'express';
import {
    getAssignedExams,
    downloadExam,
    startExam,
    submitExam,
    getExamResult,
    getProfile,
    updateProfile,
    getPracticeTopics,
    generatePracticeExam,
    submitPracticeResult
} from '../controllers/studentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require student authentication
router.use(authenticate);
router.use(authorize('student'));

// Student profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Student exam routes
router.get('/exams/assigned', getAssignedExams);
router.get('/exams/:sessionId/download', downloadExam);
router.post('/exams/:sessionId/start', startExam);
router.post('/exams/:sessionId/submit', submitExam);
router.get('/exams/:sessionId/result', getExamResult);

// Practice exam routes
router.get('/practice/topics', getPracticeTopics);
router.post('/practice/generate', generatePracticeExam);
router.post('/practice/submit', submitPracticeResult);


export default router;
