import fs from 'fs';
import xlsx from 'xlsx';
import User from '../models/User.js';
import QuestionBank from '../models/QuestionBank.js';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService.js';
import connectDB from '../config/database.js';

/**
 * Bulk Import Students via Excel/CSV
 * POST /api/admin/import/students
 */
export const bulkImportStudents = async (req, res) => {
    try {
        await connectDB();
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const row of data) {
            // Expected columns: StudentID, Name, Email, Password (optional)
            const studentId = row['StudentID'] || row['student_id'];
            const name = row['Name'] || row['name'];
            const email = row['Email'] || row['email'];
            const password = row['Password'] || row['password'] || 'student123';
            const mobile = row['Mobile'] || row['mobile_number'];

            if (!studentId || !email) {
                failCount++;
                errors.push(`Row missing ID or Email: ${JSON.stringify(row)}`);
                continue;
            }

            try {
                const existing = await User.findOne({
                    $or: [{ student_id: studentId }, { email: email }]
                });

                if (existing) {
                    failCount++;
                    errors.push(`Duplicate: ${studentId} or ${email}`);
                    continue;
                }

                const passwordHash = await bcrypt.hash(String(password), 10);

                await User.create({
                    student_id: studentId,
                    name: name || 'Unknown',
                    email,
                    mobile_number: mobile,
                    password_hash: passwordHash,
                    role: 'student'
                });

                // Send Welcome Email (Awaited for serverless)
                await sendWelcomeEmail(email, name || 'Student', studentId, password);

                successCount++;
            } catch (err) {
                failCount++;
                errors.push(`Error adding ${studentId}: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `Import processed. Success: ${successCount}, Failed: ${failCount}`,
            data: { errors }
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ success: false, message: 'Server error during import' });
    }
};

/**
 * Bulk Import Questions via Excel
 * POST /api/admin/import/questions
 */
export const bulkImportQuestions = async (req, res) => {
    try {
        await connectDB();
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let successCount = 0;
        let failCount = 0;

        for (const row of data) {
            // Expected columns: Topic, Difficulty, QuestionText, Type, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Marks
            try {
                const questionData = {
                    topic: row['Topic'] || 'General',
                    difficulty: (row['Difficulty'] || 'medium').toLowerCase(),
                    question_text: row['QuestionText'],
                    question_type: (row['Type'] || 'mcq').toLowerCase(),
                    marks: row['Marks'] || 1,
                    created_by: req.user.id
                };

                if (!questionData.question_text) {
                    failCount++;
                    continue;
                }

                // Parse Options for MCQ
                if (questionData.question_type === 'mcq') {
                    const options = [];
                    if (row['OptionA']) options.push({ option_text: row['OptionA'], is_correct: false });
                    if (row['OptionB']) options.push({ option_text: row['OptionB'], is_correct: false });
                    if (row['OptionC']) options.push({ option_text: row['OptionC'], is_correct: false });
                    if (row['OptionD']) options.push({ option_text: row['OptionD'], is_correct: false });

                    const correctLetter = (row['CorrectAnswer'] || '').trim().toUpperCase(); // e.g., 'A', 'B'

                    // Map A,B,C,D to indices if provided, else try raw text match
                    const mapping = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                    if (mapping[correctLetter] !== undefined && options[mapping[correctLetter]]) {
                        options[mapping[correctLetter]].is_correct = true;
                    } else {
                        // Fallback: Check if CorrectAnswer matches option text
                        options.forEach(opt => {
                            if (opt.option_text === row['CorrectAnswer']) opt.is_correct = true;
                        });
                    }
                    questionData.options = options;
                    questionData.correct_answer = row['CorrectAnswer'];
                } else {
                    questionData.correct_answer = row['CorrectAnswer'];
                }

                await QuestionBank.create(questionData);
                successCount++;
            } catch (err) {
                console.error('Row error:', err);
                failCount++;
            }
        }

        res.json({
            success: true,
            message: `Questions imported. Success: ${successCount}, Failed: ${failCount}`
        });
    } catch (error) {
        console.error('Question import error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
