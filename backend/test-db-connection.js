import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');

        // Check if User model exists
        const User = mongoose.model('User', new mongoose.Schema({
            student_id: String,
            name: String,
            email: String,
            password_hash: String,
            mobile_number: String,
            role: String
        }, { timestamps: true }));

        // Check if admin exists
        const admin = await User.findOne({ student_id: 'ADMIN001' });
        console.log('Admin exists:', admin ? 'YES' : 'NO');

        if (admin) {
            console.log('Admin details:', {
                student_id: admin.student_id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            });
        }

        // Check if default student exists
        const student = await User.findOne({ student_id: 'STU001' });
        console.log('Student STU001 exists:', student ? 'YES' : 'NO');

        if (student) {
            console.log('Student details:', {
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                role: student.role
            });
        }

        // Count total users
        const userCount = await User.countDocuments();
        console.log('Total users in database:', userCount);

        // Test password verification
        if (admin) {
            const testPassword = 'admin123';
            const isMatch = await bcrypt.compare(testPassword, admin.password_hash);
            console.log(`Password test for admin (using 'admin123'):`, isMatch ? 'CORRECT' : 'INCORRECT');
        }

        await mongoose.connection.close();
        console.log('✅ Test complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

testConnection();
