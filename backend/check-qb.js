import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const check = async () => {
    console.log('--- Starting QB Check ---');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const QuestionBank = mongoose.model('QuestionBank', new mongoose.Schema({}, { strict: false }));
        const count = await QuestionBank.countDocuments();
        const topics = await QuestionBank.distinct('topic');
        console.log('Total Questions:', count);
        console.log('Available Topics:', topics);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
