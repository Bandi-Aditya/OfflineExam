import QuestionBank from '../models/QuestionBank.js';

/**
 * Get all questions from bank
 * GET /api/admin/question-bank
 */
export const getAllQuestions = async (req, res) => {
    try {
        const { topic, difficulty, search } = req.query;
        let query = {};

        if (topic) query.topic = topic;
        if (difficulty) query.difficulty = difficulty;
        if (search) {
            query.question_text = { $regex: search, $options: 'i' };
        }

        const questions = await QuestionBank.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { questions }
        });
    } catch (error) {
        console.error('Get question bank error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Delete a question
 * DELETE /api/admin/question-bank/:id
 */
export const deleteQuestionHelper = async (req, res) => {
    try {
        await QuestionBank.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
