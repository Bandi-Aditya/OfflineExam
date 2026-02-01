import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true,
        index: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    question_text: {
        type: String,
        required: true
    },
    question_type: {
        type: String,
        enum: ['mcq', 'subjective'],
        default: 'mcq'
    },
    options: [{
        option_text: String,
        is_correct: Boolean
    }],
    correct_answer: {
        type: String // For subjective or simple reference
    },
    marks: {
        type: Number,
        default: 1
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export default mongoose.model('QuestionBank', questionBankSchema);
