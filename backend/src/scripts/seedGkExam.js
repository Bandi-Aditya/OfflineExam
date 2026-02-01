import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Exam from '../models/Exam.js';
import User from '../models/User.js';

dotenv.config({ path: '../../.env' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/examshield';

const gkQuestions = [
    {
        question_text: "Who is known as the 'Iron Man of India'?",
        question_type: "mcq",
        options: ["Sardar Vallabhbhai Patel", "Mahatma Gandhi", "Jawaharlal Nehru", "Subhas Chandra Bose"],
        correct_answer: "Sardar Vallabhbhai Patel",
        marks: 10,
        order_index: 1
    },
    {
        question_text: "What is the capital of France?",
        question_type: "mcq",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correct_answer: "Paris",
        marks: 10,
        order_index: 2
    },
    {
        question_text: "Which planet is known as the Red Planet?",
        question_type: "mcq",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correct_answer: "Mars",
        marks: 10,
        order_index: 3
    },
    {
        question_text: "Who wrote 'Romeo and Juliet'?",
        question_type: "mcq",
        options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Leo Tolstoy"],
        correct_answer: "William Shakespeare",
        marks: 10,
        order_index: 4
    },
    {
        question_text: "Which is the largest ocean on Earth?",
        question_type: "mcq",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correct_answer: "Pacific Ocean",
        marks: 10,
        order_index: 5
    },
    {
        question_text: "What is the chemical symbol for gold?",
        question_type: "mcq",
        options: ["Ag", "Au", "Pb", "Fe"],
        correct_answer: "Au",
        marks: 10,
        order_index: 6
    },
    {
        question_text: "Who discovered Penicillin?",
        question_type: "mcq",
        options: ["Marie Curie", "Alexander Fleming", "Isaac Newton", "Albert Einstein"],
        correct_answer: "Alexander Fleming",
        marks: 10,
        order_index: 7
    },
    {
        question_text: "Which is the longest river in the world?",
        question_type: "mcq",
        options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
        correct_answer: "Nile",
        marks: 10,
        order_index: 8
    },
    {
        question_text: "In which year did World War II end?",
        question_type: "mcq",
        options: ["1943", "1944", "1945", "1946"],
        correct_answer: "1945",
        marks: 10,
        order_index: 9
    },
    {
        question_text: "What is the smallest prime number?",
        question_type: "mcq",
        options: ["0", "1", "2", "3"],
        correct_answer: "2",
        marks: 10,
        order_index: 10
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Get an admin user to be the creator
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('No admin user found. Please create an admin first.');
            // Create a default admin if not exists (fail-safe)
            const hashedPassword = '$2a$10$YourHashedPasswordHere'; // Placeholder, usually handled by auth flow
            // Actually, let's just create one if missing for demo purposes? 
            // Better to rely on init-database.js, but let's try to proceed.
            // process.exit(1);
        }

        const creatorId = admin ? admin._id : new mongoose.Types.ObjectId();

        const gkExam = new Exam({
            title: "General Knowledge Quiz 2024",
            description: "A comprehensive quiz covering history, geography, science, and literature.",
            duration_minutes: 20,
            total_marks: 100,
            passing_marks: 40,
            created_by: creatorId,
            is_active: true,
            questions: gkQuestions
        });

        await gkExam.save();
        console.log('GK Exam seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding GK exam:', error);
        process.exit(1);
    }
}

seed();
