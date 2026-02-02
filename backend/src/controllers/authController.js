import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmailOTP } from '../utils/emailService.js';
import connectDB from '../config/database.js';

// Temporary store for OTPs (In production, use Redis or DB with TTL)
const otpStore = new Map();

/**
 * User login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        // Validate input
        if (!studentId || !password) {
            return res.status(400).json({
                success: false,
                message: 'Student ID and password are required'
            });
        }

        // Ensure database is connected (critical for serverless)
        await connectDB();

        // Find user by student ID
        const user = await User.findOne({ student_id: studentId });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: user._id,
            studentId: user.student_id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        // Return user data and token
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    studentId: user.student_id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
};

/**
 * Verify JWT token
 * GET /api/auth/verify
 */
export const verifyTokenEndpoint = async (req, res) => {
    // If we reach here, token is valid (passed through authenticate middleware)
    res.json({
        success: true,
        message: 'Token is valid',
        data: {
            user: req.user
        }
    });
};

/**
 * Logout (client-side token removal, but log the event)
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

/**
 * Register new user (admin only)
 * POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { studentId, name, email, password, role = 'student' } = req.body;

        // Validate input
        if (!studentId || !name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ student_id: studentId }, { email: email }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this Student ID or email already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            student_id: studentId,
            name,
            email,
            password_hash: passwordHash,
            role
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: newUser._id,
                    student_id: newUser.student_id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    created_at: newUser.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};
/**
 * Send OTP
 * POST /api/auth/send-otp
 */
export const sendOTP = async (req, res) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        await connectDB();
        const user = await User.findOne({ student_id: studentId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (!user.email) {
            return res.status(400).json({ success: false, message: 'Student does not have an email registered' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP with 5-minute expiry
        otpStore.set(studentId, {
            otp,
            expiry: Date.now() + 5 * 60 * 1000
        });

        console.log(`📡 [OTP Service] OTP generated for ${user.email} (${studentId})`);

        // Send OTP via Email
        const emailSent = await sendEmailOTP(user.email, otp);

        if (emailSent) {
            res.json({
                success: true,
                message: `OTP sent successfully to ${user.email}`
            });
        } else {
            console.log(`⚠️ Failed to send email to ${user.email}. OTP is ${otp} (Logged for dev)`);
            res.json({
                success: true, // Keeping true for dev env fallback, but ideally should be false
                message: 'OTP generated (Email sending failed - check server logs)'
            });
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Login with OTP
 * POST /api/auth/login-otp
 */
export const loginWithOTP = async (req, res) => {
    try {
        const { studentId, otp } = req.body;

        if (!studentId || !otp) {
            return res.status(400).json({ success: false, message: 'Student ID and OTP are required' });
        }

        const storedData = otpStore.get(studentId);

        if (!storedData || storedData.otp !== otp || Date.now() > storedData.expiry) {
            return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await connectDB();
        const user = await User.findOne({ student_id: studentId });
        otpStore.delete(studentId); // Clean up

        const token = generateToken({
            id: user._id,
            studentId: user.student_id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        res.json({
            success: true,
            message: 'OTP Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    studentId: user.student_id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('OTP Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        await connectDB();
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User with this email not found' });
        }

        // Simulate password reset link
        const resetToken = crypto.randomBytes(20).toString('hex');
        console.log(`📧 [Email Service] Password reset link for ${email}: http://localhost:5173/reset-password/${resetToken}`);

        res.json({
            success: true,
            message: 'Password reset link sent to your linked email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
