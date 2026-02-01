import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const STUDENTS_TO_ADD = [
    { studentId: 'STU101', name: 'John Doe', email: 'john@example.com', password: 'password123' },
    { studentId: 'STU102', name: 'Jane Smith', email: 'jane@example.com', password: 'password123' },
    // Add more students here...
];

const bulkImport = async () => {
    try {
        console.log('🔌 Connecting to Database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log(`🚀 Starting bulk import of ${STUDENTS_TO_ADD.length} students...`);

        let successCount = 0;
        let failCount = 0;

        for (const student of STUDENTS_TO_ADD) {
            try {
                const existing = await User.findOne({
                    $or: [{ student_id: student.studentId }, { email: student.email }]
                });

                if (existing) {
                    console.log(`⚠️ Skipping ${student.studentId} (${student.email}) - Already exists.`);
                    failCount++;
                    continue;
                }

                const passwordHash = await bcrypt.hash(student.password, 10);

                const newUser = new User({
                    student_id: student.studentId,
                    name: student.name,
                    email: student.email,
                    password_hash: passwordHash,
                    role: 'student'
                });

                await newUser.save();
                console.log(`✅ Added ${student.studentId} - ${student.name}`);
                successCount++;
            } catch (err) {
                console.error(`❌ Error adding ${student.studentId}:`, err.message);
                failCount++;
            }
        }

        console.log('\n================================');
        console.log(`🎉 Import Complete!`);
        console.log(`✅ Success: ${successCount}`);
        console.log(`⚠️ Skipped/Failed: ${failCount}`);
        console.log('================================');

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
};

bulkImport();
