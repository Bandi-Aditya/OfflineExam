import express from 'express';
import { login, verifyTokenEndpoint, logout, register, sendOTP, loginWithOTP, forgotPassword } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
// Login endpoint - POST only, but add GET handler for testing/debugging
router.post('/login', login);
router.get('/login', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Method not allowed. Use POST request with { studentId, password } in the request body.',
        method: req.method,
        requiredMethod: 'POST',
        example: {
            method: 'POST',
            url: '/api/auth/login',
            body: {
                studentId: 'ADMIN001',
                password: 'admin123'
            }
        }
    });
});
router.post('/send-otp', sendOTP);
router.post('/login-otp', loginWithOTP);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/verify', authenticate, verifyTokenEndpoint);
router.post('/logout', authenticate, logout);
router.post('/register', authenticate, authorize('admin'), register);

export default router;
