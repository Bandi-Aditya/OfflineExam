import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connected!');

        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log('Total users:', count);

        if (count > 0) {
            const users = await mongoose.connection.db.collection('users').find({}).project({ student_id: 1, name: 1, email: 1, role: 1 }).limit(5).toArray();
            console.log('Sample users:');
            users.forEach(u => console.log(`  - ${u.student_id}: ${u.name} (${u.role})`));
        } else {
            console.log('⚠️ No users found in database! You need to seed the database.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkUsers();
