import React, { useState, useEffect } from 'react';
import { questionBankService, importService } from '../services/api';
import { Database, Upload, Search, Filter, Trash2, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const QuestionBank = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await questionBankService.getAllQuestions();
            setQuestions(res.data.questions || []);
        } catch (err) {
            console.error('Fetch questions error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const res = await importService.bulkImportQuestions(file);
            alert(res.message);
            fetchQuestions();
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to import questions');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await questionBankService.deleteQuestion(id);
            fetchQuestions();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredQuestions = questions.filter(q =>
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Question Bank</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Centralized repository of examination questions.</p>
                </div>
                <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={20} /> Import Batch (Excel)
                    <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by question text or topic..."
                        style={{ width: '100%', paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="glass" style={{ overflow: 'hidden' }}>
                <table style={{ margin: 0 }}>
                    <thead>
                        <tr>
                            <th>Question</th>
                            <th>Topic</th>
                            <th>Type</th>
                            <th>Difficulty</th>
                            <th>Marks</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading repository...</td></tr>
                        ) : filteredQuestions.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No questions found. Import an Excel file to get started.</td></tr>
                        ) : filteredQuestions.map((q) => (
                            <motion.tr
                                key={q._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <td style={{ maxWidth: '400px' }}>
                                    <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                                        <div style={{ marginTop: '0.2rem' }}><FileText size={16} color="var(--primary)" /></div>
                                        <div>
                                            <p style={{ fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {q.question_text}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="badge badge-primary">{q.topic}</span></td>
                                <td style={{ textTransform: 'capitalize' }}>{q.question_type}</td>
                                <td>
                                    <span style={{
                                        color: q.difficulty === 'hard' ? 'var(--error)' : q.difficulty === 'medium' ? 'var(--warning)' : 'var(--success)',
                                        textTransform: 'capitalize', fontWeight: '600'
                                    }}>
                                        {q.difficulty}
                                    </span>
                                </td>
                                <td>{q.marks}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button className="btn-secondary" onClick={() => handleDelete(q._id)} style={{ padding: '0.5rem', color: 'var(--error)' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QuestionBank;
