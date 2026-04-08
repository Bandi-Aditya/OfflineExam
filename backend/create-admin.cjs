const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
console.log('Using URI:', MONGODB_URI ? 'Found' : 'NOT FOUND');

const userSchema = new mongoose.Schema({
  student_id: String,
  name: String,
  email: String,
  password_hash: String,
  role: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB!');

    const existing = await User.findOne({ student_id: 'ADMIN001' });
    if (existing) {
      console.log('Admin exists - resetting password...');
      existing.password_hash = await bcrypt.hash('admin123', 10);
      await existing.save();
      console.log('Password reset to admin123');
    } else {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        student_id: 'ADMIN001',
        name: 'System Administrator',
        email: 'admin@exam.com',
        password_hash: passwordHash,
        role: 'admin',
      });
      console.log('Admin user CREATED!');
    }
    console.log('Done! Login with ADMIN001 / admin123');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}

createAdmin();
