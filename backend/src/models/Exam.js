import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    question_text: {
        type: String,
        required: true
    },
    question_type: {
        type: String,
        enum: ['mcq', 'descriptive'],
        required: true
    },
    options: [String], // Array of strings for MCQ options
    correct_answer: {
        type: String,
        required: true
    },
    marks: {
        type: Number,
        required: true
    },
    order_index: {
        type: Number,
        required: true
    }
});

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    duration_minutes: {
        type: Number,
        required: true
    },
    total_marks: {
        type: Number,
        required: true
    },
    passing_marks: {
        type: Number,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    questions: [questionSchema]
}, {
    timestamps: true
});

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
