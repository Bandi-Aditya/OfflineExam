import React, { useState, useEffect } from 'react';
import { examService } from '../services/api';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Download, FileText, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Exams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingExam, setEditingExam] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);
    const [selectedExamForQuestions, setSelectedExamForQuestions] = useState(null);
    const [examQuestions, setExamQuestions] = useState([]);
    const [newExam, setNewExam] = useState({
        title: '',
        description: '',
        durationMinutes: 60,
        totalMarks: 100,
        passingMarks: 40,
        mode: 'manual',
        file: null,
        topic: '',
        level: 'medium'
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await examService.getExams();
            setExams(res.data.exams || []);
        } catch (err) {
            console.error('Failed to fetch exams', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (newExam.mode === 'upload') {
                if (!newExam.file) return alert('Please select a file');
                res = await examService.uploadExam(newExam.file, {
                    title: newExam.title,
                    durationMinutes: newExam.durationMinutes
                });
            } else if (newExam.mode === 'auto') {
                res = await examService.generateExam({
                    topic: newExam.topic,
                    level: newExam.level,
                    title: newExam.title,
                    durationMinutes: newExam.durationMinutes
                });
            } else {
                res = await examService.createExam(newExam);
            }

            if (res.success) {
                setShowModal(false);
                fetchExams();
                setNewExam({
                    title: '',
                    description: '',
                    durationMinutes: 60,
                    totalMarks: 100,
                    passingMarks: 40,
                    mode: 'manual',
                    file: null,
                    topic: '',
                    level: 'medium'
                });
                alert('Exam package created successfully!');
            }
        } catch (err) {
            console.error('Create exam error:', err);
            alert(err.response?.data?.message || 'Failed to create exam');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await examService.updateExam(editingExam.id, editingExam);
            if (res.success) {
                setShowEditModal(false);
                fetchExams();
                alert('Exam updated successfully!');
            }
        } catch (err) {
            alert('Failed to update exam');
        }
    };

    const handleDeleteExam = async (id) => {
        if (!confirm('Are you sure you want to delete this exam package? This will remove all associated questions.')) return;
        try {
            await examService.deleteExam(id);
            fetchExams();
        } catch (err) {
            alert('Failed to delete exam');
        }
    };

    const handleManageQuestions = async (exam) => {
        try {
            const res = await examService.getExamById(exam.id);
            setSelectedExamForQuestions(res.data.exam);
            setExamQuestions(res.data.questions || []);
            setShowQuestionsModal(true);
        } catch (err) {
            alert('Failed to fetch questions');
        }
    };

    const handleAddQuestion = async () => {
        const questionText = prompt('Enter question text:');
        if (!questionText) return;
        const marks = parseInt(prompt('Enter marks:', '2')) || 2;

        const type = confirm('Is it an MCQ? (OK for MCQ, Cancel for Subjective)') ? 'mcq' : 'subjective';
        let options = [];
        let correctAnswer = '';

        if (type === 'mcq') {
            const optStr = prompt('Enter options separated by comma (e.g. A, B, C, D):');
            options = optStr ? optStr.split(',').map(s => s.trim()) : [];
            correctAnswer = prompt('Enter the CORRECT answer (exactly as typed in options):');
        } else {
            correctAnswer = prompt('Enter reference answer or leave blank:');
        }

        try {
            await examService.addQuestion(selectedExamForQuestions.id, {
                questionText,
                questionType: type,
                options,
                correctAnswer,
                marks,
                orderIndex: examQuestions.length
            });
            // Refresh
            handleManageQuestions(selectedExamForQuestions);
        } catch (err) {
            alert('Failed to add question');
        }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!confirm('Delete this question?')) return;
        try {
            await examService.deleteQuestion(qId);
            handleManageQuestions(selectedExamForQuestions);
        } catch (err) {
            alert('Failed to delete question');
        }
    };

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Exam Repository</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Create, manage, and deploy encrypted examination packages.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Create New Exam
                </button>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by title, subject or code..."
                        style={{ width: '100%', paddingLeft: '3rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={18} /> Filters
                </button>
            </div>

            <div className="glass" style={{ overflow: 'hidden' }}>
                <table style={{ margin: 0 }}>
                    <thead>
                        <tr>
                            <th>Package Name</th>
                            <th>Category</th>
                            <th>Configuration</th>
                            <th>Authored On</th>
                            <th>Security Status</th>
                            <th style={{ textAlign: 'right' }}>Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading exams...</td></tr>
                        ) : exams.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())).map((exam) => (
                            <motion.tr
                                key={exam.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.002 }}
                            >
                                <td style={{ minWidth: '250px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px' }}>
                                            <FileText size={20} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600' }}>{exam.title}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{exam.id?.slice(-8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="badge badge-primary">Academic</span></td>
                                <td>
                                    <div style={{ fontSize: '0.875rem' }}>
                                        <p>{exam.question_count || 0} Questions</p>
                                        <p style={{ color: 'var(--text-muted)' }}>{exam.duration_minutes} Minutes Limit</p>
                                    </div>
                                </td>
                                <td>{new Date(exam.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <span className={`badge ${exam.is_active ? 'badge-success' : 'badge-warning'}`}>
                                        {exam.is_active ? 'Encrypted' : 'Draft Mode'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '0.5rem' }}
                                            title="Manage Questions"
                                            onClick={() => handleManageQuestions(exam)}
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '0.5rem' }}
                                            title="Edit Configuration"
                                            onClick={() => {
                                                setEditingExam({ ...exam });
                                                setShowEditModal(true);
                                            }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '0.5rem', color: 'var(--error)' }}
                                            title="Decommission"
                                            onClick={() => handleDeleteExam(exam.id)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass"
                            style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '2rem' }}>Construct New Exam Package</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => setNewExam({ ...newExam, mode: 'manual' })}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: newExam.mode !== 'upload' ? '2px solid var(--primary)' : 'none',
                                        color: newExam.mode !== 'upload' ? 'var(--primary)' : 'var(--text-muted)'
                                    }}
                                >
                                    Manual Creation
                                </button>
                                <button
                                    onClick={() => setNewExam({ ...newExam, mode: 'upload' })}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: newExam.mode === 'upload' ? '2px solid var(--primary)' : 'none',
                                        color: newExam.mode === 'upload' ? 'var(--primary)' : 'var(--text-muted)'
                                    }}
                                >
                                    Upload from Excel
                                </button>
                                <button
                                    onClick={() => setNewExam({ ...newExam, mode: 'auto' })}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: newExam.mode === 'auto' ? '2px solid var(--primary)' : 'none',
                                        color: newExam.mode === 'auto' ? 'var(--primary)' : 'var(--text-muted)'
                                    }}
                                >
                                    Auto-Generate (AI)
                                </button>
                            </div>

                            <form onSubmit={handleCreate}>
                                {newExam.mode === 'upload' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={(e) => setNewExam({ ...newExam, file: e.target.files[0] })}
                                                style={{ marginBottom: '1rem' }}
                                            />
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                Upload Excel file with columns: <br />
                                                <code>QuestionText, Type, OptionA-D, CorrectAnswer, Marks</code>
                                            </p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Exam Title (Optional - takes from file name otherwise)"
                                                value={newExam.title}
                                                onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Duration (Minutes)"
                                                value={newExam.durationMinutes}
                                                onChange={e => setNewExam({ ...newExam, durationMinutes: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : newExam.mode === 'auto' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Topic (e.g., Data Structures, React.js)"
                                                value={newExam.topic}
                                                onChange={e => setNewExam({ ...newExam, topic: e.target.value })}
                                                required
                                            />
                                            <select
                                                value={newExam.level}
                                                onChange={e => setNewExam({ ...newExam, level: e.target.value })}
                                                required
                                            >
                                                <option value="easy">Beginner Level</option>
                                                <option value="medium">Intermediate Level</option>
                                                <option value="hard">Advanced Level</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Exam Title"
                                                value={newExam.title}
                                                onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Duration (Minutes)"
                                                value={newExam.durationMinutes}
                                                onChange={e => setNewExam({ ...newExam, durationMinutes: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                            The system will automatically select 10-20 relevant questions from the repository.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Exam Title</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Advanced Algorithms Final"
                                                value={newExam.title}
                                                onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                                                required={newExam.mode !== 'upload'}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Description</label>
                                            <textarea
                                                placeholder="Detailed information about the exam..."
                                                style={{ height: '100px' }}
                                                value={newExam.description}
                                                onChange={e => setNewExam({ ...newExam, description: e.target.value })}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Duration (Minutes)</label>
                                            <input
                                                type="number"
                                                placeholder="60"
                                                value={newExam.durationMinutes}
                                                onChange={e => setNewExam({ ...newExam, durationMinutes: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Marks</label>
                                            <input
                                                type="number"
                                                placeholder="100"
                                                value={newExam.totalMarks}
                                                onChange={e => setNewExam({ ...newExam, totalMarks: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Passing Marks</label>
                                            <input
                                                type="number"
                                                placeholder="40"
                                                value={newExam.passingMarks}
                                                onChange={e => setNewExam({ ...newExam, passingMarks: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border)', textAlign: 'center', marginBottom: '2.5rem', marginTop: '2rem' }}>
                                    <Download size={32} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <h4>Security Packaging</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                        Content will be AES-256 encrypted. Questions can be added after package initialization.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">
                                        {newExam.mode === 'upload' ? 'Upload & Create' : (newExam.mode === 'auto' ? 'Generate Exam' : 'Initialize Package')} <ChevronRight size={18} />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showEditModal && editingExam && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ width: '100%', maxWidth: '600px', padding: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.75rem' }}>Edit Exam Configuration</h2>
                                <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Exam Title</label>
                                    <input
                                        type="text"
                                        value={editingExam.title}
                                        onChange={e => setEditingExam({ ...editingExam, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Description</label>
                                    <textarea
                                        value={editingExam.description}
                                        onChange={e => setEditingExam({ ...editingExam, description: e.target.value })}
                                        style={{ height: '100px' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Duration (Mins)</label>
                                        <input
                                            type="number"
                                            value={editingExam.duration_minutes}
                                            onChange={e => setEditingExam({ ...editingExam, duration_minutes: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Passing Marks</label>
                                        <input
                                            type="number"
                                            value={editingExam.passing_marks}
                                            onChange={e => setEditingExam({ ...editingExam, passing_marks: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showQuestionsModal && selectedExamForQuestions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem' }}>Manage Questions</h2>
                                    <p style={{ color: 'var(--text-muted)' }}>{selectedExamForQuestions.title}</p>
                                </div>
                                <button onClick={() => setShowQuestionsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>

                            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <span className="badge badge-primary">{examQuestions.length} Questions</span>
                                    <span className="badge badge-success">Total: {examQuestions.reduce((s, q) => s + q.marks, 0)} Marks</span>
                                </div>
                                <button className="btn-primary" onClick={handleAddQuestion}>
                                    <Plus size={18} /> Add New Question
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {examQuestions.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No questions added yet.</div>
                                ) : examQuestions.map((q, idx) => (
                                    <div key={q.id} className="glass" style={{ padding: '1.5rem', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}># {idx + 1} ({q.question_type.toUpperCase()})</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{q.marks} Marks</span>
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ marginBottom: '1rem' }}>{q.question_text}</p>
                                        {q.question_type === 'mcq' && q.options && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                {q.options.map((opt, i) => (
                                                    <div key={i} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.85rem', border: opt === q.correct_answer ? '1px solid var(--success)' : '1px solid transparent' }}>
                                                        {opt} {opt === q.correct_answer && ' ✓'}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Exams;
