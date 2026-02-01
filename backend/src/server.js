import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import importRoutes from './routes/importRoutes.js';
import questionBankRoutes from './routes/questionBankRoutes.js';
import { checkAndSendReminders } from './utils/notificationService.js';

// Initialize environment variables
dotenv.config();

// Connect to Database
import connectDB from './config/database.js';
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        process.env.ADMIN_URL || 'http://localhost:5174'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', sessionRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin/import', importRoutes);
app.use('/api/admin/question-bank', questionBankRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Background Tasks
setInterval(checkAndSendReminders, 10 * 60 * 1000); // Check every 10 minutes
checkAndSendReminders(); // Initial check on startup

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║     🎓  SECURE OFFLINE EXAMINATION SYSTEM - SERVER  🎓     ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('   - GET  /health');
    console.log('   - POST /api/auth/login');
    console.log('   - GET  /api/auth/verify');
    console.log('   - GET  /api/admin/exams');
    console.log('   - GET  /api/student/exams/assigned');
    console.log('');
    console.log('✅ Ready to accept connections!');
    console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

export default app;
