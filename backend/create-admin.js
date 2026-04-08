import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  student_id: String,
  name: String,
  email: String,
  password_hash: String,
  role: String,
  mobile_number: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    // Check if admin already exists
    const existing = await User.findOne({ student_id: 'ADMIN001' });
    if (existing) {
      console.log('Admin user already exists! Updating password...');
      existing.password_hash = await bcrypt.hash('admin123', 10);
      await existing.save();
      console.log('Password updated successfully!');
    } else {
      // Create new admin
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        student_id: 'ADMIN001',
        name: 'System Administrator',
        email: 'admin@exam.com',
        password_hash: passwordHash,
        role: 'admin',
      });
      console.log('Admin user created successfully!');
    }

    console.log('');
    console.log('Login credentials:');
    console.log('  Admin ID: ADMIN001');
    console.log('  Password: admin123');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
