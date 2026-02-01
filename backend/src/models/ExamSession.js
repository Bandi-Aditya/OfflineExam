import mongoose from 'mongoose';

const examAssignmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'submitted'],
        default: 'pending'
    },
    login_time: Date,
    start_time: Date,
    submit_time: Date,
    score: {
        type: Number,
        default: 0
    },
    auto_submitted: {
        type: Boolean,
        default: false
    },
    session_token: {
        type: String,
        unique: true,
        sparse: true
    },
    answers: [{
        question_id: String, // Question ID from embedded array
        answer_text: String,
        is_correct: Boolean,
        marks_awarded: Number,
        answered_at: {
            type: Date,
            default: Date.now
        }
    }],
    previous_attempts: [{
        status: String,
        login_time: Date,
        start_time: Date,
        submit_time: Date,
        score: Number,
        auto_submitted: Boolean,
        answers: Array
    }]
}, { _id: true });

const examSessionSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    session_name: {
        type: String,
        required: true
    },
    start_time: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date,
        required: true
    },
    mode: {
        type: String,
        enum: ['online', 'offline'],
        required: true,
        default: 'offline'
    },
    classroom: String,
    floor: String,
    block: String,
    lab_name: String, // Keeping specifically for Computer Lab scenarios
    is_active: {
        type: Boolean,
        default: false
    },
    assignments: [examAssignmentSchema]
}, {
    timestamps: true
});

const ExamSession = mongoose.model('ExamSession', examSessionSchema);
export default ExamSession;
