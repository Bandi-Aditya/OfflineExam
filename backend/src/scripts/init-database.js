import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import ExamSession from '../models/ExamSession.js';

/**
 * Initialize database and seed with initial data
 */
export const seedDatabase = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await connectDB();

    // SAFETY CHECK: Only clear data if specifically requested or in dev mode
    // For now, we will NOT automatically clear data to prevent accidents.
    // await User.deleteMany({});
    // await Exam.deleteMany({});
    // await ExamSession.deleteMany({});

    console.log('ℹ️  Skipping automatic data clearing to protect existing data.');
    console.log('    If you want to reset, use a dedicated reset script or uncomment lines in init-database.js');

    console.log('🌱 Seeding database with initial data...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      student_id: 'ADMIN001',
      name: 'System Administrator',
      email: 'admin@exam.com',
      password_hash: adminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Created admin user (ID: ADMIN001, Password: admin123)');

    // Create ONE default student for testing
    const studentPassword = await bcrypt.hash('student123', 10);
    const students = [];

    const defaultStudent = new User({
      student_id: 'STU001',
      name: 'Test Student',
      email: 'student@exam.com',
      mobile_number: '1234567890',
      password_hash: studentPassword,
      role: 'student'
    });
    await defaultStudent.save();
    students.push(defaultStudent);

    console.log('✅ Created 1 default student (ID: STU001, Password: student123)');

    // Create a sample exam
    const exam = new Exam({
      title: 'General Knowledge 101',
      description: 'A basic exam covering world history, science, and geography.',
      duration_minutes: 30,
      total_marks: 50,
      passing_marks: 20,
      created_by: admin._id,
      questions: [
        {
          question_text: 'What is the capital of France?',
          question_type: 'mcq',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correct_answer: 'Paris',
          marks: 10,
          order_index: 1
        },
        {
          question_text: 'Which planet is known as the Red Planet?',
          question_type: 'mcq',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correct_answer: 'Mars',
          marks: 10,
          order_index: 2
        },
        {
          question_text: 'What is the largest ocean on Earth?',
          question_type: 'mcq',
          options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
          correct_answer: 'Pacific',
          marks: 10,
          order_index: 3
        },
        {
          question_text: 'Explain the process of photosynthesis briefly.',
          question_type: 'descriptive',
          correct_answer: 'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments.',
          marks: 20,
          order_index: 4
        }
      ]
    });
    await exam.save();
    console.log('✅ Created sample exam');

    // Create a sample session
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const session = new ExamSession({
      exam: exam._id,
      session_name: 'Morning Session A',
      start_time: now,
      end_time: tomorrow,
      lab_name: 'Lab 101',
      is_active: true,
      assignments: students.map(s => ({
        student: s._id,
        status: 'pending'
      }))
    });
    await session.save();
    console.log('✅ Created sample session and assigned students');

    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
