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

// Connect to Database (non-blocking)
import connectDB from './config/database.js';
// Connect to database asynchronously - don't block route registration
setTimeout(() => {
    connectDB().catch(err => {
        console.error('Database connection error:', err);
        // Don't exit in serverless - let routes still work
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
    });
}, 0);

const app = express();
const PORT = process.env.PORT || 5000;

// Manual CORS & Preflight handling
app.use((req, res, next) => {
    const origin = req.headers.origin;

    // For this deployment we trust any origin that calls us.
    // We echo back the Origin header so that credentials (Authorization header) work.
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle Preflight (OPTIONS) requests immediately
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});
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

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Request URL:', req.url);
    console.log('Request Path:', req.path);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        vercel: process.env.VERCEL === '1' ? 'yes' : 'no'
    });
});

// Root endpoint with route information
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Secure Offline Examination System API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            auth: {
                login: 'POST /api/auth/login',
                verify: 'GET /api/auth/verify',
                sendOTP: 'POST /api/auth/send-otp',
                loginOTP: 'POST /api/auth/login-otp'
            },
            admin: {
                exams: 'GET /api/admin/exams',
                sessions: 'GET /api/admin/sessions',
                students: 'GET /api/admin/students'
            },
            student: {
                assignedExams: 'GET /api/student/exams/assigned',
                profile: 'GET /api/student/profile'
            }
        },
        timestamp: new Date().toISOString(),
        routesRegistered: true
    });
});

// API root endpoint - lists all available API endpoints
// Handle both /api and /api/ (with trailing slash)
// IMPORTANT: Define this BEFORE the rate limiter to avoid conflicts
const apiInfoHandler = (req, res) => {
    console.log('API root endpoint hit:', req.method, req.path);
    res.json({
        success: true,
        message: 'Secure Offline Examination System API',
        version: '1.0.0',
        baseUrl: req.protocol + '://' + req.get('host') + '/api',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                verify: 'GET /api/auth/verify',
                sendOTP: 'POST /api/auth/send-otp',
                loginOTP: 'POST /api/auth/login-otp',
                forgotPassword: 'POST /api/auth/forgot-password',
                logout: 'POST /api/auth/logout',
                register: 'POST /api/auth/register (admin only)'
            },
            admin: {
                exams: 'GET /api/admin/exams',
                createExam: 'POST /api/admin/exams',
                sessions: 'GET /api/admin/sessions',
                createSession: 'POST /api/admin/sessions',
                students: 'GET /api/admin/students',
                createStudent: 'POST /api/admin/students'
            },
            student: {
                assignedExams: 'GET /api/student/exams/assigned',
                downloadExam: 'GET /api/student/exams/:sessionId/download',
                startExam: 'POST /api/student/exams/:sessionId/start',
                submitExam: 'POST /api/student/exams/:sessionId/submit',
                getResult: 'GET /api/student/exams/:sessionId/result',
                profile: 'GET /api/student/profile'
            },
            test: 'GET /api/test',
            health: 'GET /health'
        },
        timestamp: new Date().toISOString()
    });
};

app.get('/api', apiInfoHandler);
app.get('/api/', apiInfoHandler);

// Test endpoint to verify route registration
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API routes are working!',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Rate limiting - apply AFTER specific routes
app.use('/api/', limiter);

// API Routes
try {
    console.log('Registering routes...');
    app.use('/api/auth', authRoutes);
    console.log('✅ /api/auth routes registered');
    app.use('/api/admin', adminRoutes);
    console.log('✅ /api/admin routes registered');
    app.use('/api/admin', sessionRoutes);
    console.log('✅ /api/admin session routes registered');
    app.use('/api/student', studentRoutes);
    console.log('✅ /api/student routes registered');
    app.use('/api/admin/import', importRoutes);
    console.log('✅ /api/admin/import routes registered');
    app.use('/api/admin/question-bank', questionBankRoutes);
    console.log('✅ /api/admin/question-bank routes registered');
    console.log('✅ All routes registered successfully');
} catch (error) {
    console.error('❌ Error registering routes:', error);
    throw error;
}

// Simple DB debug endpoint – helps verify Atlas connection in production
app.get('/api/debug/db', async (req, res) => {
    try {
        const conn = await connectDB();
        const state = conn.connection.readyState; // 1 = connected

        res.json({
            success: true,
            message: 'DB debug status',
            readyState: state,
            host: conn.connection.host,
        });
    } catch (err) {
        console.error('DB debug error:', err);
        res.status(500).json({
            success: false,
            message: 'DB debug failed',
            error: err.message,
        });
    }
});

// Debug endpoint to check users in database
app.get('/api/debug/users', async (req, res) => {
    try {
        const User = (await import('./models/User.js')).default;
        const count = await User.countDocuments();
        const users = await User.find({}, { student_id: 1, name: 1, email: 1, role: 1, _id: 0 }).limit(5);

        res.json({
            success: true,
            message: 'Users debug status',
            totalUsers: count,
            sampleUsers: users
        });
    } catch (err) {
        console.error('Users debug error:', err);
        res.status(500).json({
            success: false,
            message: 'Users debug failed',
            error: err.message,
        });
    }
});

// 404 handler - must be last
app.use((req, res) => {
    console.log('404 - Route not found:', req.method, req.path, req.url);
    console.log('Available routes should include: /, /health, /api, /api/test, /api/auth/*, etc.');
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
        url: req.url,
        method: req.method,
        hint: 'Try /api or /health or /api/test'
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

// Background Tasks (only run in non-serverless environments)
// Note: Vercel serverless functions don't support long-running processes
// Consider using Vercel Cron Jobs or external scheduler for reminders
if (process.env.VERCEL !== '1') {
    setInterval(checkAndSendReminders, 10 * 60 * 1000); // Check every 10 minutes
    checkAndSendReminders(); // Initial check on startup
}

// Start server only if not in Vercel serverless environment
// Vercel will handle the HTTP server, we just export the app
if (process.env.VERCEL !== '1') {
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
} else {
    console.log('🚀 Running on Vercel serverless environment');
    console.log('✅ Express app exported and ready for Vercel');
    // Log registered routes for debugging
    console.log('Registered routes:');
    console.log('  - GET  /');
    console.log('  - GET  /health');
    console.log('  - POST /api/auth/login');
    console.log('  - GET  /api/auth/verify');
    console.log('  - POST /api/auth/send-otp');
    console.log('  - POST /api/auth/login-otp');
}

// Handle unhandled promise rejections (only in non-serverless)
if (process.env.VERCEL !== '1') {
    process.on('unhandledRejection', (err) => {
        console.error('❌ Unhandled Promise Rejection:', err);
        process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        process.exit(1);
    });
}

// Export for Vercel serverless
// Vercel will use this as the serverless function handler
export default app;
