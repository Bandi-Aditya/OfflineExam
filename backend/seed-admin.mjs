import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Connecting...');
await mongoose.connect(uri);
console.log('Connected!');

const User = mongoose.model('User', new mongoose.Schema({
  student_id: String, name: String, email: String,
  password_hash: String, role: String
}, { timestamps: true }));

const exists = await User.findOne({ student_id: 'ADMIN001' });
if (exists) {
  exists.password_hash = await bcrypt.hash('admin123', 10);
  await exists.save();
  console.log('Admin password reset to: admin123');
} else {
  await User.create({
    student_id: 'ADMIN001', name: 'System Administrator',
    email: 'admin@exam.com',
    password_hash: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  console.log('Admin user CREATED! Login: ADMIN001 / admin123');
}

// Create/update student user
const studentExists = await User.findOne({ student_id: 'STU001' });
if (studentExists) {
  studentExists.password_hash = await bcrypt.hash('student123', 10);
  await studentExists.save();
  console.log('Student password reset to: student123');
} else {
  await User.create({
    student_id: 'STU001', name: 'Test Student',
    email: 'student@exam.com',
    mobile_number: '1234567890',
    password_hash: await bcrypt.hash('student123', 10),
    role: 'student'
  });
  console.log('Student user CREATED! Login: STU001 / student123');
}
await mongoose.disconnect();
console.log('Done!');
