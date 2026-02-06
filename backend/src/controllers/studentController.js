import ExamSession from '../models/ExamSession.js';
import Exam from '../models/Exam.js';
import { encrypt, generateSessionToken } from '../utils/encryption.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';


/**
 * Get assigned exams for a student
 * GET /api/student/exams/assigned
 */
export const getAssignedExams = async (req, res) => {
    try {
        await connectDB();
        const studentId = req.user.id;

        const sessions = await ExamSession.find({
            'assignments.student': studentId
        })
            .populate('exam', 'title description duration_minutes total_marks')
            .sort({ start_time: -1 });

        const exams = sessions.map(s => {
            const assignment = s.assignments.find(a => a.student.toString() === studentId.toString());
            return {
                session_id: s._id,
                session_name: s.session_name,
                start_time: s.start_time,
                end_time: s.end_time,
                is_active: s.is_active,
                exam_id: s.exam?._id,
                exam_title: s.exam?.title,
                description: s.exam?.description,
                duration_minutes: s.exam?.duration_minutes,
                total_marks: s.exam?.total_marks,
                assignment_id: assignment?._id,
                status: assignment?.status,
                score: assignment?.score,
                submit_time: assignment?.submit_time
            };
        });

        res.json({
            success: true,
            data: { exams }
        });
    } catch (error) {
        console.error('Get assigned exams error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching assigned exams'
        });
    }
};

/**
 * Download exam (with encryption)
 * GET /api/student/exams/:sessionId/download
 */
export const downloadExam = async (req, res) => {
    try {
        await connectDB();
        const { sessionId } = req.params;
        const studentId = req.user.id;

        const session = await ExamSession.findById(sessionId).populate('exam');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const assignment = session.assignments.find(a => a.student.toString() === studentId.toString());

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'You are not assigned to this exam session'
            });
        }

        if (!session.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Exam session is not active yet'
            });
        }

        // If already submitted, archive the previous attempt and allow retake
        if (assignment.status === 'submitted') {
            // Archive the previous attempt
            assignment.previous_attempts.push({
                status: assignment.status,
                login_time: assignment.login_time,
                start_time: assignment.start_time,
                submit_time: assignment.submit_time,
                score: assignment.score,
                auto_submitted: assignment.auto_submitted,
                answers: assignment.answers
            });

            // Reset the assignment for retake
            assignment.status = 'pending';
            assignment.score = 0;
            assignment.answers = [];
            assignment.auto_submitted = false;
            assignment.submit_time = null;
            assignment.start_time = null;
        }

        const sessionToken = generateSessionToken();
        assignment.login_time = new Date();
        assignment.session_token = sessionToken;

        await session.save();

        const examData = {
            assignmentId: assignment._id,
            sessionToken,
            exam: {
                id: session.exam._id,
                title: session.exam.title,
                description: session.exam.description,
                durationMinutes: session.exam.duration_minutes,
                totalMarks: session.exam.total_marks
            },
            questions: session.exam.questions.map(q => ({
                id: q._id,
                questionText: q.question_text,
                questionType: q.question_type,
                options: q.options,
                marks: q.marks,
                orderIndex: q.order_index
            }))
        };

        const encryptedData = encrypt(examData);

        res.json({
            success: true,
            message: 'Exam downloaded successfully',
            data: {
                encryptedExam: encryptedData,
                sessionId: sessionId
            }
        });
    } catch (error) {
        console.error('Download exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while downloading exam'
        });
    }
};

/**
 * Start exam (mark as in progress)
 * POST /api/student/exams/:sessionId/start
 */
export const startExam = async (req, res) => {
    try {
        await connectDB();
        const { sessionId } = req.params;
        const studentId = req.user.id;
        const { sessionToken } = req.body;

        const session = await ExamSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const assignment = session.assignments.find(a =>
            a.student.toString() === studentId.toString() && a.session_token === sessionToken
        );

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'Invalid session token'
            });
        }

        if (assignment.status === 'submitted') {
            return res.status(403).json({
                success: false,
                message: 'Exam already submitted'
            });
        }

        assignment.status = 'in_progress';
        assignment.start_time = new Date();

        await session.save();

        res.json({
            success: true,
            message: 'Exam started successfully',
            data: {
                assignmentId: assignment._id,
                startTime: assignment.start_time
            }
        });
    } catch (error) {
        console.error('Start exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while starting exam'
        });
    }
};

/**
 * Submit exam answers
 * POST /api/student/exams/:sessionId/submit
 */
export const submitExam = async (req, res) => {
    try {
        await connectDB();
        const { sessionId } = req.params;
        const studentId = req.user.id;
        const { sessionToken, answers, autoSubmitted = false } = req.body;

        const session = await ExamSession.findById(sessionId).populate('exam');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const assignment = session.assignments.find(a =>
            a.student.toString() === studentId.toString() && a.session_token === sessionToken
        );

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'Invalid session or token'
            });
        }

        if (assignment.status === 'submitted') {
            return res.status(403).json({
                success: false,
                message: 'Exam already submitted'
            });
        }

        const questionsMap = {};
        session.exam.questions.forEach(q => {
            questionsMap[q._id.toString()] = q;
        });

        let totalScore = 0;
        const studentAnswers = [];

        for (const answer of answers) {
            const question = questionsMap[answer.questionId];
            if (!question) continue;

            let isCorrect = false;
            let marksAwarded = 0;

            if (question.question_type === 'mcq') {
                isCorrect = answer.answerText?.trim().toLowerCase() === question.correct_answer?.trim().toLowerCase();
                marksAwarded = isCorrect ? question.marks : 0;
            } else {
                isCorrect = null;
                marksAwarded = 0;
            }

            totalScore += marksAwarded;

            studentAnswers.push({
                question_id: answer.questionId,
                answer_text: answer.answerText,
                is_correct: isCorrect,
                marks_awarded: marksAwarded,
                answered_at: new Date()
            });
        }

        assignment.status = 'submitted';
        assignment.submit_time = new Date();
        assignment.score = totalScore;
        assignment.auto_submitted = autoSubmitted;
        assignment.answers = studentAnswers;

        await session.save();

        res.json({
            success: true,
            message: 'Exam submitted successfully',
            data: {
                score: totalScore,
                autoSubmitted
            }
        });
    } catch (error) {
        console.error('Submit exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting exam'
        });
    }
};

/**
 * Get exam result
 * GET /api/student/exams/:sessionId/result
 */
export const getExamResult = async (req, res) => {
    try {
        await connectDB();
        const { sessionId } = req.params;
        const studentId = req.user.id;

        const session = await ExamSession.findById(sessionId).populate('exam');

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        const assignment = session.assignments.find(a =>
            a.student.toString() === studentId.toString()
        );

        if (!assignment || assignment.status !== 'submitted') {
            return res.status(404).json({
                success: false,
                message: 'Result not found or exam not submitted yet'
            });
        }

        const passingMarks = session.exam?.passing_marks || 0;
        const resultStatus = assignment.score >= passingMarks ? 'Pass' : 'Fail';

        // Check if exam time has ended
        const examHasEnded = new Date() > new Date(session.end_time);

        let detailedAnswers = null;

        // Only show answers if exam session has ended
        if (examHasEnded) {
            const questionsMap = {};
            session.exam.questions.forEach(q => {
                questionsMap[q._id.toString()] = q;
            });

            detailedAnswers = assignment.answers.map(ans => {
                const question = questionsMap[ans.question_id];
                return {
                    question_text: question?.question_text,
                    question_type: question?.question_type,
                    options: question?.options,
                    your_answer: ans.answer_text,
                    correct_answer: question?.correct_answer,
                    is_correct: ans.is_correct,
                    marks_awarded: ans.marks_awarded,
                    total_marks: question?.marks
                };
            });
        }

        res.json({
            success: true,
            data: {
                result: {
                    score: assignment.score,
                    submit_time: assignment.submit_time,
                    auto_submitted: assignment.auto_submitted,
                    total_marks: session.exam?.total_marks,
                    passing_marks: passingMarks,
                    exam_title: session.exam?.title,
                    result: resultStatus,
                    exam_has_ended: examHasEnded,
                    answers: detailedAnswers // Will be null if exam hasn't ended
                }
            }
        });
    } catch (error) {
        console.error('Get result error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching result'
        });
    }
};

/**
 * Get student profile
 * GET /api/student/profile
 */
export const getProfile = async (req, res) => {
    try {
        await connectDB();
        const studentId = req.user.id;
        const user = await User.findById(studentId).select('-password_hash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                profile: {
                    id: user._id,
                    student_id: user.student_id,
                    name: user.name,
                    email: user.email,
                    mobile_number: user.mobile_number
                }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
};

/**
 * Update student profile (student can update name and mobile, but NOT email)
 * PUT /api/student/profile
 */
export const updateProfile = async (req, res) => {
    try {
        await connectDB();
        const studentId = req.user.id;
        const { name, mobile_number, password } = req.body;

        const user = await User.findById(studentId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update allowed fields
        if (name) user.name = name;
        if (mobile_number !== undefined) user.mobile_number = mobile_number;

        // Update password if provided
        if (password) {
            user.password_hash = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                profile: {
                    id: user._id,
                    student_id: user.student_id,
                    name: user.name,
                    email: user.email,
                    mobile_number: user.mobile_number
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
};

/**
 * Get available practice topics
 * GET /api/student/practice/topics
 */
export const getPracticeTopics = async (req, res) => {
    try {
        await connectDB();
        const QuestionBank = (await import('../models/QuestionBank.js')).default;
        const topics = await QuestionBank.distinct('topic');
        res.json({ success: true, data: { topics } });
    } catch (error) {
        console.error('Get practice topics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Generate a practice exam
 * POST /api/student/practice/generate
 */
export const generatePracticeExam = async (req, res) => {
    try {
        await connectDB();
        const { topic, level, questionCount = 10 } = req.body;
        const QuestionBank = (await import('../models/QuestionBank.js')).default;

        const query = {};
        if (topic) query.topic = topic;
        if (level) query.difficulty = level;

        const allQuestions = await QuestionBank.find(query);

        if (allQuestions.length === 0) {
            return res.status(400).json({ success: false, message: 'No questions found for the selected topic and difficulty level. Try a different combination.' });
        }

        // Shuffle and take requested count
        const selected = allQuestions.sort(() => 0.5 - Math.random()).slice(0, questionCount);

        const examData = {
            id: 'practice_' + Date.now(),
            title: `Practice: ${topic || 'Mixed'} (${level || 'All'})`,
            durationMinutes: selected.length * 2, // 2 mins per question
            totalMarks: selected.reduce((s, q) => s + (q.marks || 1), 0),
            questions: selected.map((q, idx) => ({
                id: q._id,
                questionText: q.question_text,
                questionType: q.question_type,
                options: q.options.map(o => o.option_text),
                marks: q.marks || 1,
                orderIndex: idx + 1
            }))
        };

        // For practice, we don't necessarily need a session record in DB if we calculate on submit,
        // but we'll return a token to simulate a real exam.
        const sessionToken = generateSessionToken();

        res.json({
            success: true,
            data: {
                exam: examData,
                sessionToken
            }
        });
    } catch (error) {
        console.error('Generate practice exam error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Submit practice exam and get results immediately
 * POST /api/student/practice/submit
 */
export const submitPracticeResult = async (req, res) => {
    try {
        await connectDB();
        const { questions, answers } = req.body;
        const QuestionBank = (await import('../models/QuestionBank.js')).default;

        let totalScore = 0;
        let maxMarks = 0;
        const feedback = [];

        for (const q of questions) {
            const actualQuestion = await QuestionBank.findById(q.id);
            if (!actualQuestion) continue;

            const studentAnswer = answers.find(a => a.questionId === q.id.toString())?.answerText;
            const isCorrect = studentAnswer?.trim().toLowerCase() === actualQuestion.correct_answer?.trim().toLowerCase();

            maxMarks += actualQuestion.marks || 1;
            if (isCorrect) totalScore += actualQuestion.marks || 1;

            feedback.push({
                questionText: actualQuestion.question_text,
                yourAnswer: studentAnswer,
                correctAnswer: actualQuestion.correct_answer,
                isCorrect,
                marks: actualQuestion.marks || 1,
                awarded: isCorrect ? actualQuestion.marks : 0
            });
        }

        res.json({
            success: true,
            data: {
                score: totalScore,
                totalMarks: maxMarks,
                percentage: Math.round((totalScore / maxMarks) * 100),
                feedback
            }
        });
    } catch (error) {
        console.error('Submit practice error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
