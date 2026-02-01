import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing connection to:', process.env.MONGODB_URI);

try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully!');
    process.exit(0);
} catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
}
