import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Exam from './src/models/Exam.js';
import ExamSession from './src/models/ExamSession.js';

dotenv.config();

const checkData = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);

        const userCount = await User.countDocuments();
        const examCount = await Exam.countDocuments();
        const sessionCount = await ExamSession.countDocuments();

        console.log('--- Database Status ---');
        console.log(`Users: ${userCount}`);
        console.log(`Exams: ${examCount}`);
        console.log(`Sessions: ${sessionCount}`);
        console.log('-----------------------');

        if (userCount > 0) {
            const users = await User.find({}, 'name email role').limit(5);
            console.log('Sample Users:', users);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkData();
