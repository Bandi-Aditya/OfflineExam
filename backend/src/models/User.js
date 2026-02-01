import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    student_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    mobile_number: {
        type: String,
        trim: true,
        default: null
    },
    password_hash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'student'],
        default: 'student'
    }
}, {
    timestamps: true
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password_hash);
};

const User = mongoose.model('User', userSchema);
export default User;
