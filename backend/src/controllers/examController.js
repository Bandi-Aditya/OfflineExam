import Exam from '../models/Exam.js';
import QuestionBank from '../models/QuestionBank.js';
import mongoose from 'mongoose';
import fs from 'fs';
import xlsx from 'xlsx';
import connectDB from '../config/database.js';

/**
 * Create a new exam
 * POST /api/admin/exams
 */
export const createExam = async (req, res) => {
    try {
        await connectDB();
        const { title, description, durationMinutes, totalMarks, passingMarks } = req.body;
        const createdBy = req.user.id;

        // Validate input
        if (!title || !durationMinutes || !totalMarks || !passingMarks) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const exam = new Exam({
            title,
            description,
            duration_minutes: durationMinutes,
            total_marks: totalMarks,
            passing_marks: passingMarks,
            created_by: createdBy
        });

        await exam.save();

        res.status(201).json({
            success: true,
            message: 'Exam created successfully',
            data: { exam }
        });
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating exam'
        });
    }
};

/**
 * Get all exams
 * GET /api/admin/exams
 */
export const getAllExams = async (req, res) => {
    try {
        await connectDB();
        const exams = await Exam.find()
            .populate('created_by', 'name')
            .sort({ createdAt: -1 });

        // Transform to match previous structure if needed
        const formattedExams = exams.map(e => ({
            ...e._doc,
            id: e._id,
            creator_name: e.created_by?.name,
            question_count: e.questions.length
        }));

        res.json({
            success: true,
            data: { exams: formattedExams }
        });
    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching exams'
        });
    }
};

/**
 * Get exam by ID with questions
 * GET /api/admin/exams/:id
 */
export const getExamById = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;

        const exam = await Exam.findById(id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        res.json({
            success: true,
            data: {
                exam: {
                    ...exam._doc,
                    id: exam._id
                },
                questions: exam.questions.map(q => ({
                    ...q._doc,
                    id: q._id
                }))
            }
        });
    } catch (error) {
        console.error('Get exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching exam'
        });
    }
};

/**
 * Update exam
 * PUT /api/admin/exams/:id
 */
export const updateExam = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { title, description, durationMinutes, totalMarks, passingMarks, isActive } = req.body;

        const exam = await Exam.findById(id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        if (title !== undefined) exam.title = title;
        if (description !== undefined) exam.description = description;
        if (durationMinutes !== undefined) exam.duration_minutes = durationMinutes;
        if (totalMarks !== undefined) exam.total_marks = totalMarks;
        if (passingMarks !== undefined) exam.passing_marks = passingMarks;
        if (isActive !== undefined) exam.is_active = isActive;

        await exam.save();

        res.json({
            success: true,
            message: 'Exam updated successfully',
            data: { exam }
        });
    } catch (error) {
        console.error('Update exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating exam'
        });
    }
};

/**
 * Delete exam
 * DELETE /api/admin/exams/:id
 */
export const deleteExam = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;

        const exam = await Exam.findByIdAndDelete(id);

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        res.json({
            success: true,
            message: 'Exam deleted successfully'
        });
    } catch (error) {
        console.error('Delete exam error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting exam'
        });
    }
};

/**
 * Add question to exam
 * POST /api/admin/exams/:examId/questions
 */
export const addQuestion = async (req, res) => {
    try {
        await connectDB();
        const { examId } = req.params;
        const { questionText, questionType, options, correctAnswer, marks, orderIndex } = req.body;

        // Validate input
        if (!questionText || !questionType || !marks) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found'
            });
        }

        // Get next order index if not provided
        let finalOrderIndex = orderIndex;
        if (finalOrderIndex === undefined || finalOrderIndex === null) {
            finalOrderIndex = exam.questions.length + 1;
        }

        const newQuestion = {
            question_text: questionText,
            question_type: questionType,
            options: options || [],
            correct_answer: correctAnswer,
            marks,
            order_index: finalOrderIndex
        };

        exam.questions.push(newQuestion);
        await exam.save();

        res.status(201).json({
            success: true,
            message: 'Question added successfully',
            data: { question: exam.questions[exam.questions.length - 1] }
        });
    } catch (error) {
        console.error('Add question error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding question'
        });
    }
};

/**
 * Update question
 * PUT /api/admin/questions/:id
 * In MongoDB with embedded doc, we need the examId or find the exam containing the question.
 */
export const updateQuestion = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params; // questionId
        const { questionText, questionType, options, correctAnswer, marks, orderIndex } = req.body;

        // Find exam that has this question
        const exam = await Exam.findOne({ 'questions._id': id });

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        const question = exam.questions.id(id);

        if (questionText !== undefined) question.question_text = questionText;
        if (questionType !== undefined) question.question_type = questionType;
        if (options !== undefined) question.options = options;
        if (correctAnswer !== undefined) question.correct_answer = correctAnswer;
        if (marks !== undefined) question.marks = marks;
        if (orderIndex !== undefined) question.order_index = orderIndex;

        await exam.save();

        res.json({
            success: true,
            message: 'Question updated successfully',
            data: { question }
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating question'
        });
    }
};

/**
 * Delete question
 * DELETE /api/admin/questions/:id
 */
export const deleteQuestion = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;

        const exam = await Exam.findOne({ 'questions._id': id });

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        exam.questions.pull(id);
        await exam.save();

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting question'
        });
    }
};

/**
 * Upload Exam from File
 * POST /api/admin/exams/upload
 */
export const uploadExam = async (req, res) => {
    try {
        await connectDB();
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { title, description, durationMinutes, totalMarks, passingMarks } = req.body;
        // Check if req.user exists
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User ID missing.' });
        }
        const createdBy = req.user.id;

        // Parse file
        let workbook;
        try {
            workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid file format. Could not parse Excel.' });
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, message: 'Excel file is empty or has no data.' });
        }

        const questions = [];
        let calculatedTotalMarks = 0;
        const errors = [];

        // Parse rows into questions
        data.forEach((row, index) => {
            // Normalize keys to lowercase to be more forgiving? Or just check variations
            // For now, strict on QuestionText or question_text
            const qText = row['QuestionText'] || row['question_text'] || row['Question'];

            if (!qText) {
                // Skip empty rows
                return;
            }

            const rawType = row['Type'] || row['type'] || 'mcq';
            const typeLower = rawType.toLowerCase().trim();
            // Map common variances
            const validTypes = ['mcq', 'descriptive']; // from schema
            let questionType = validTypes.includes(typeLower) ? typeLower : 'mcq';
            if (typeLower === 'subjective') questionType = 'descriptive';

            const marks = parseInt(row['Marks'] || row['marks'] || 1);
            if (isNaN(marks)) {
                errors.push(`Row ${index + 2}: Invalid marks`);
                return;
            }
            calculatedTotalMarks += marks;

            const correctAnswer = row['CorrectAnswer'] || row['correct_answer'] || row['Answer'];
            // Validating required fields
            if (!correctAnswer && questionType === 'mcq') {
                // For MCQ, correct answer is usually required.
                // If not present, maybe we shouldn't add it? Or default?
                // Schema says required.
                errors.push(`Row ${index + 2}: Missing CorrectAnswer`);
                return;
            }

            const question = {
                question_text: qText,
                question_type: questionType,
                marks: marks,
                order_index: index + 1,
                correct_answer: correctAnswer || 'N/A' // Fallback for descriptive if missing, but schema requires it.
            };

            if (question.question_type === 'mcq') {
                const options = [];
                if (row['OptionA']) options.push(row['OptionA']);
                if (row['OptionB']) options.push(row['OptionB']);
                if (row['OptionC']) options.push(row['OptionC']);
                if (row['OptionD']) options.push(row['OptionD']);

                if (options.length === 0) {
                    // Try to find if columns are Option 1, Option 2 etc?
                    // For now, assume strict format as requested.
                }
                question.options = options;
            }

            questions.push(question);
        });

        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid questions found in file.',
                errors
            });
        }

        const exam = new Exam({
            title: title || `Imported Exam ${new Date().toLocaleDateString()}`,
            description: description || 'Imported from Excel',
            duration_minutes: durationMinutes || 60,
            total_marks: totalMarks || calculatedTotalMarks,
            passing_marks: passingMarks || Math.floor(calculatedTotalMarks * 0.4),
            created_by: createdBy,
            questions: questions
        });

        await exam.save();

        res.status(201).json({
            success: true,
            message: `Exam imported successfully with ${questions.length} questions.`,
            data: { exam, warnings: errors }
        });

    } catch (error) {
        console.error('Upload exam error:', error);
        // Respond with the actual error message for debugging
        res.status(500).json({
            success: false,
            message: 'Server error during upload: ' + error.message,
            error: error.toString()
        });
    }
};

/**
 * Auto-generate exam from Question Bank
 * POST /api/admin/exams/auto-generate
 */
export const generateExamFromBank = async (req, res) => {
    try {
        await connectDB();
        const { topic, level, title, durationMinutes } = req.body;
        const createdBy = req.user.id;

        // Find questions matching topic and difficulty
        // Using regex for topic for flexibility
        const questions = await QuestionBank.find({
            topic: { $regex: new RegExp(topic, 'i') },
            difficulty: level
        }).limit(20);

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No questions found for topic "${topic}" and level "${level}"`
            });
        }

        // Shuffle and pick 10 (or all if less)
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);

        const totalMarks = selected.reduce((sum, q) => sum + (q.marks || 1), 0);

        const exam = new Exam({
            title: title || `Auto: ${topic} (${level})`,
            description: `Automatically generated exam on ${topic} at ${level} difficulty.`,
            duration_minutes: durationMinutes || 60,
            total_marks: totalMarks,
            passing_marks: Math.ceil(totalMarks * 0.4),
            created_by: createdBy,
            questions: selected.map((q, idx) => ({
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options.map(opt => opt.option_text),
                correct_answer: q.correct_answer || (q.options.find(o => o.is_correct)?.option_text),
                marks: q.marks,
                order_index: idx
            }))
        });

        await exam.save();

        res.status(201).json({
            success: true,
            message: 'Exam generated successfully from bank',
            data: { exam }
        });

    } catch (error) {
        console.error('Auto generate exam error:', error);
        res.status(500).json({ success: false, message: 'Server error during generation' });
    }
};
