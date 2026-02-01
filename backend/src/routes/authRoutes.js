import express from 'express';
import { login, verifyTokenEndpoint, logout, register, sendOTP, loginWithOTP, forgotPassword } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/login-otp', loginWithOTP);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/verify', authenticate, verifyTokenEndpoint);
router.post('/logout', authenticate, logout);
router.post('/register', authenticate, authorize('admin'), register);

export default router;
