import express from 'express';
import {
    createSession,
    getAllSessions,
    getSessionById,
    updateSession,
    deleteSession,
    toggleSession,
    getLiveStatus,
    getSessionResults,
    exportResults,
    getAllStudents,
    createStudent,
    updateStudent,
    stopStudentTest,
    getStudentHistory,
    deleteStudent
} from '../controllers/sessionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Session routes
router.post('/sessions', createSession);
router.get('/sessions', getAllSessions);
router.get('/sessions/:id', getSessionById);
router.put('/sessions/:id', updateSession);
router.put('/sessions/:id/toggle', toggleSession);
router.delete('/sessions/:id', deleteSession);
router.get('/sessions/:id/live-status', getLiveStatus);
router.get('/sessions/:id/results', getSessionResults);
router.get('/results/export/:sessionId', exportResults);
router.post('/sessions/:sessionId/students/:studentId/stop', stopStudentTest);

// Student management
router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.get('/students/:id/history', getStudentHistory);

export default router;
