import Exam from '../models/Exam.js';
import ExamSession from '../models/ExamSession.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { sendWelcomeEmail, sendExamScheduledEmail, sendExamUpdateEmail } from '../utils/emailService.js';

/**
 * Create exam session
 * POST /api/admin/sessions
 */
export const createSession = async (req, res) => {
    try {
        const { examId, sessionName, startTime, endTime, labName, studentIds, mode, classroom, floor, block } = req.body;

        // Validate input
        if (!examId || !sessionName || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Determine students to assign
        let assignedStudentIds = studentIds;

        // If no specific students selected, assign ALL students (default behavior for easier testing/usage)
        if (!assignedStudentIds || assignedStudentIds.length === 0) {
            const allStudents = await User.find({ role: { $ne: 'admin' } }).select('_id');
            assignedStudentIds = allStudents.map(s => s._id);
        }

        // Create assignments
        const assignments = assignedStudentIds.map(studentId => ({
            student: studentId,
            status: 'pending'
        }));

        // Create session
        const session = new ExamSession({
            exam: examId,
            session_name: sessionName,
            start_time: startTime,
            end_time: endTime,
            lab_name: labName, // Optional
            mode: mode || 'offline',
            classroom,
            floor,
            block,
            assignments
        });

        await session.save();

        // Send Notification Emails
        try {
            const populatedSession = await ExamSession.findById(session._id)
                .populate('exam', 'title')
                .populate('assignments.student', 'email name');

            for (const assignment of populatedSession.assignments) {
                if (assignment.student?.email) {
                    await sendExamScheduledEmail(assignment.student.email, {
                        session_name: populatedSession.session_name,
                        start_time: populatedSession.start_time,
                        lab_name: populatedSession.lab_name,
                        classroom: populatedSession.classroom,
                        floor: populatedSession.floor,
                        block: populatedSession.block,
                        exam_title: populatedSession.exam?.title
                    });
                }
            }
        } catch (emailErr) {
            console.error('Failed to send session creation emails:', emailErr);
        }

        res.status(201).json({
            success: true,
            message: 'Exam session created successfully and notifications sent',
            data: { session }
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating session'
        });
    }
};

/**
 * Update exam session
 * PUT /api/admin/sessions/:id
 */
export const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { examId, sessionName, startTime, endTime, labName, mode, classroom, floor, block } = req.body;

        const session = await ExamSession.findById(id);
        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const oldTime = session.start_time;
        const oldVenue = `${session.classroom}-${session.floor}-${session.block}`;

        if (examId) session.exam = examId;
        if (sessionName) session.session_name = sessionName;
        if (startTime) session.start_time = startTime;
        if (endTime) session.end_time = endTime;
        if (labName !== undefined) session.lab_name = labName;
        if (mode) session.mode = mode;
        if (classroom !== undefined) session.classroom = classroom;
        if (floor !== undefined) session.floor = floor;
        if (block !== undefined) session.block = block;

        await session.save();

        // Send Update Emails if critical details changed
        const timeChanged = new Date(oldTime).getTime() !== new Date(startTime).getTime();
        const venueChanged = oldVenue !== `${classroom}-${floor}-${block}`;

        if (timeChanged || venueChanged) {
            try {
                const populatedSession = await ExamSession.findById(session._id)
                    .populate('exam', 'title')
                    .populate('assignments.student', 'email name');

                for (const assignment of populatedSession.assignments) {
                    if (assignment.student?.email) {
                        await sendExamUpdateEmail(assignment.student.email, {
                            session_name: populatedSession.session_name,
                            start_time: populatedSession.start_time,
                            lab_name: populatedSession.lab_name,
                            classroom: populatedSession.classroom,
                            floor: populatedSession.floor,
                            block: populatedSession.block,
                            exam_title: populatedSession.exam?.title
                        });
                    }
                }
            } catch (emailErr) {
                console.error('Failed to send update emails:', emailErr);
            }
        }

        res.json({
            success: true,
            message: 'Session updated successfully',
            data: { session }
        });
    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all sessions
 * GET /api/admin/sessions
 */
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await ExamSession.find()
            .populate('exam', 'title')
            .sort({ createdAt: -1 });

        const formattedSessions = sessions.map(s => {
            const totalStudents = s.assignments.length;
            const submittedCount = s.assignments.filter(a => a.status === 'submitted').length;

            return {
                ...s._doc,
                id: s._id,
                exam_title: s.exam?.title,
                total_students: totalStudents,
                submitted_count: submittedCount
            };
        });

        res.json({
            success: true,
            data: { sessions: formattedSessions }
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching sessions'
        });
    }
};

/**
 * Get session by ID with details
 * GET /api/admin/sessions/:id
 */
export const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await ExamSession.findById(id)
            .populate('exam', 'title duration_minutes total_marks')
            .populate('assignments.student', 'student_id name email');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const formattedAssignments = session.assignments.map(a => ({
            ...a._doc,
            id: a._id,
            student_id: a.student?.student_id,
            name: a.student?.name,
            email: a.student?.email
        }));

        res.json({
            success: true,
            data: {
                session: {
                    ...session._doc,
                    id: session._id,
                    exam_title: session.exam?.title,
                    duration_minutes: session.exam?.duration_minutes,
                    total_marks: session.exam?.total_marks
                },
                assignments: formattedAssignments
            }
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching session'
        });
    }
};

/**
 * Activate/deactivate session
 * PUT /api/admin/sessions/:id/toggle
 */
export const toggleSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const session = await ExamSession.findByIdAndUpdate(
            id,
            { is_active: isActive },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        res.json({
            success: true,
            message: `Session ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: { session }
        });
    } catch (error) {
        console.error('Toggle session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while toggling session'
        });
    }
};

/**
 * Get live session status (for monitoring dashboard)
 * GET /api/admin/sessions/:id/live-status
 */
export const getLiveStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await ExamSession.findById(id)
            .populate('assignments.student', 'student_id name')
            .populate('exam', 'questions');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const totalQuestions = session.exam?.questions?.length || 0;

        const students = session.assignments.map(a => ({
            id: a._id,
            status: a.status,
            login_time: a.login_time,
            start_time: a.start_time,
            submit_time: a.submit_time,
            score: a.score,
            student_id: a.student?.student_id,
            name: a.student?.name,
            answered_count: a.answers.length,
            total_questions: totalQuestions
        }));

        res.json({
            success: true,
            data: { students }
        });
    } catch (error) {
        console.error('Get live status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching live status'
        });
    }
};

/**
 * Get session results
 * GET /api/admin/sessions/:id/results
 */
export const getSessionResults = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await ExamSession.findById(id)
            .populate('assignments.student', 'student_id name email')
            .populate('exam', 'total_marks passing_marks');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const results = session.assignments.map(a => {
            const passingMarks = session.exam?.passing_marks || 0;
            let resultStatus = 'Fail';
            if (a.score >= passingMarks) resultStatus = 'Pass';
            if (a.status !== 'submitted') resultStatus = 'Not Attempted';

            return {
                id: a._id,
                score: a.score,
                status: a.status,
                submit_time: a.submit_time,
                auto_submitted: a.auto_submitted,
                student_id: a.student?.student_id,
                name: a.student?.name,
                email: a.student?.email,
                total_marks: session.exam?.total_marks,
                passing_marks: passingMarks,
                result: resultStatus
            };
        }).sort((a, b) => (b.score || 0) - (a.score || 0));

        res.json({
            success: true,
            data: { results }
        });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching results'
        });
    }
};

/**
 * Export results as CSV
 * GET /api/admin/results/export/:sessionId
 */
export const exportResults = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ExamSession.findById(sessionId)
            .populate('assignments.student', 'student_id name email')
            .populate('exam', 'total_marks passing_marks');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const results = session.assignments.map(a => {
            const passingMarks = session.exam?.passing_marks || 0;
            let resultStatus = 'Fail';
            if (a.score >= passingMarks) resultStatus = 'Pass';
            if (a.status !== 'submitted') resultStatus = 'Not Attempted';

            return {
                'Student ID': a.student?.student_id,
                'Name': a.student?.name,
                'Email': a.student?.email,
                'Score': a.score,
                'Total Marks': session.exam?.total_marks,
                'Passing Marks': passingMarks,
                'Result': resultStatus,
                'Submit Time': a.submit_time || '',
                'Auto Submitted': a.auto_submitted ? 'Yes' : 'No'
            };
        });

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No results found'
            });
        }

        const headers = Object.keys(results[0]);
        const csvRows = [headers.join(',')];

        for (const row of results) {
            const values = headers.map(header => {
                const value = row[header];
                return `"${value !== null ? value : ''}"`;
            });
            csvRows.push(values.join(','));
        }

        const csv = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=exam-results-${sessionId}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export results error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting results'
        });
    }
};

/**
 * Create a new student
 * POST /api/admin/students
 */
export const createStudent = async (req, res) => {
    try {
        const { studentId, name, email, password, mobileNumber } = req.body;

        // Basic validation
        if (!studentId || !name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ student_id: studentId }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Student ID or Email already exists' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const student = new User({
            student_id: studentId,
            name,
            email,
            mobile_number: mobileNumber || null,
            password_hash,
            role: 'student'
        });

        await student.save();

        // Send Welcome Email
        try {
            await sendWelcomeEmail(email, name, studentId, password);
        } catch (emailErr) {
            console.error('Welcome Email Error:', emailErr);
        }

        res.status(201).json({
            success: true,
            message: 'Student registered successfully and welcome email sent',
            data: { student }
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ success: false, message: 'Server error while registering student' });
    }
};

/**
 * Update student details (Admin)
 * PUT /api/admin/students/:id
 */
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, studentId, mobileNumber, password } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (studentId) user.student_id = studentId;
        if (mobileNumber !== undefined) user.mobile_number = mobileNumber;

        if (password) {
            user.password_hash = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({ success: true, message: 'Student details updated successfully' });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get all students
 * GET /api/admin/students
 */
export const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).sort({ name: 1 });
        res.json({
            success: true,
            data: {
                students: students.map(s => ({
                    id: s._id,
                    student_id: s.student_id,
                    name: s.name,
                    email: s.email,
                    mobile_number: s.mobile_number,
                    createdAt: s.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get student history and details
 * GET /api/admin/students/:id/history
 */
export const getStudentHistory = async (req, res) => {
    try {
        const { id } = req.params;

        // Find all sessions where this student was assigned
        const sessions = await ExamSession.find({ 'assignments.student': id })
            .populate('exam', 'title total_marks passing_marks')
            .sort({ createdAt: -1 });

        const history = sessions.map(session => {
            const assignment = session.assignments.find(a => a.student.toString() === id);
            return {
                sessionId: session._id,
                sessionName: session.session_name,
                examTitle: session.exam?.title,
                status: assignment.status,
                score: assignment.score,
                submitTime: assignment.submit_time,
                previousAttempts: assignment.previous_attempts,
                endTime: session.end_time
            };
        });

        res.json({ success: true, data: { history } });
    } catch (error) {
        console.error('Get student history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Stop student test (Online monitoring)
 * POST /api/admin/sessions/:sessionId/students/:studentId/stop
 */
export const stopStudentTest = async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;

        const session = await ExamSession.findById(sessionId);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const assignment = session.assignments.find(a => a.student.toString() === studentId);
        if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

        if (assignment.status === 'in_progress') {
            assignment.status = 'submitted';
            assignment.submit_time = new Date();
            assignment.auto_submitted = true; // Mark as forced stop
            await session.save();
        }

        res.json({ success: true, message: 'Student test stopped successfully' });
    } catch (error) {
        console.error('Stop test error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete student
 * DELETE /api/admin/students/:id
 */
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        // Ensure we only delete students, not admins
        const user = await User.findOneAndDelete({ _id: id, role: { $ne: 'admin' } });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Student not found or cannot be deleted' });
        }

        // Also remove from any sessions? Or keep history?
        // Ideally we should keep history or handle cascades, but for now simple delete.
        // Mongoose doesn't cascade by default.

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete session
 * DELETE /api/admin/sessions/:id
 */
export const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await ExamSession.findByIdAndDelete(id);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
