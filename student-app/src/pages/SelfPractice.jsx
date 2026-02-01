import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { practiceService } from '../services/api';
import { BookOpen, Trophy, Clock, ArrowLeft, Play, Layout, ChevronRight, CheckCircle2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SelfPractice = () => {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('medium');
    const [questionCount, setQuestionCount] = useState(10);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Practice Session State
    const [showTest, setShowTest] = useState(false);
    const [currentQuestions, setCurrentQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const res = await practiceService.getTopics();
            setTopics(res.data.topics || []);
        } catch (err) {
            console.error('Failed to fetch topics', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!selectedTopic) {
            alert('Please select a topic first.');
            return;
        }
        setStarting(true);
        try {
            const res = await practiceService.generateExam({
                topic: selectedTopic,
                level: selectedLevel,
                questionCount
            });
            if (res.success) {
                setCurrentQuestions(res.data.exam.questions);
                setAnswers([]);
                setCurrentIndex(0);
                setShowTest(true);
            }
        } catch (err) {
            alert('Could not generate test: ' + (err.response?.data?.message || 'Error'));
        } finally {
            setStarting(false);
        }
    };

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => {
            const existing = prev.filter(a => a.questionId !== questionId);
            return [...existing, { questionId, answerText: answer }];
        });
    };

    const handleFinish = async () => {
        if (!confirm('Finish and see results?')) return;

        try {
            const res = await practiceService.submitResult({
                questions: currentQuestions,
                answers: answers
            });
            if (res.success) {
                setResult(res.data);
            }
        } catch (err) {
            alert('Submission failed');
        }
    };

    const renderSelection = () => (
        <div className="layout-container">
            <header style={{ marginBottom: '3rem' }}>
                <button
                    onClick={() => navigate('/portal')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}
                >
                    <ArrowLeft size={18} /> Back to Portal
                </button>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Self Improvement</h1>
                <p style={{ color: 'var(--text-muted)' }}>Generate adaptive mock tests to sharpen your skills.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                <section className="glass" style={{ padding: '2.5rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>1. SELECT SUBJECT MATTER</h3>
                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                placeholder="Search any topic (e.g. Physics, Data Structures...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', paddingLeft: '3rem', background: 'rgba(255,255,255,0.03)' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {topics.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase())).map(topic => (
                                <div
                                    key={topic}
                                    onClick={() => setSelectedTopic(topic)}
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: '16px',
                                        background: selectedTopic === topic ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                        border: `1px solid ${selectedTopic === topic ? 'var(--primary)' : 'var(--border)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    <BookOpen size={24} style={{ marginBottom: '0.75rem', color: selectedTopic === topic ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    <p style={{ fontWeight: '600', color: selectedTopic === topic ? 'white' : 'var(--text-muted)' }}>{topic}</p>
                                </div>
                            ))}
                            {topics.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No topics match your search.
                                </div>
                            )}
                        </div>
                    </div>


                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>2. CONFIGURE DIFFICULTY</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['easy', 'medium', 'hard'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setSelectedLevel(l)}
                                    className={selectedLevel === l ? 'btn-primary' : 'btn-secondary'}
                                    style={{ flex: 1, textTransform: 'capitalize' }}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>3. QUESTION COUNT</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[5, 10, 15, 20].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setQuestionCount(c)}
                                    className={questionCount === c ? 'btn-primary' : 'btn-secondary'}
                                    style={{ flex: 1 }}
                                >
                                    {c} Items
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="glass" style={{ padding: '2.5rem', background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, transparent 100%)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px rgba(99,102,241,0.3)' }}>
                                <Play size={24} color="white" />
                            </div>
                            <h2>Test Configuration</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Ready to start your practice session.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Subject</span>
                                <span style={{ fontWeight: '600' }}>{selectedTopic || 'Not Selected'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Complexity</span>
                                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{selectedLevel}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                                <span style={{ fontWeight: '600' }}>{questionCount * 2} Minutes</span>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleStart}
                            disabled={!selectedTopic || starting}
                            style={{ width: '100%', marginTop: '3rem', padding: '1.25rem' }}
                        >
                            {starting ? 'Generating Test...' : 'Initialize Mock Session'}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );

    const renderTest = () => {
        if (result) return renderResult();

        const q = currentQuestions[currentIndex];
        const currentAnswer = answers.find(a => a.questionId === q.id)?.answerText;

        return (
            <div className="layout-container" style={{ maxWidth: '900px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem' }}>{selectedTopic} Practice</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Question {currentIndex + 1} of {currentQuestions.length}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', fontSize: '1.25rem', fontWeight: '700' }}>
                            {Math.floor((currentQuestions.length * 2 * 60) / 60)}:00
                        </div>
                        <button className="btn-secondary" style={{ color: 'var(--error)' }} onClick={() => setShowTest(false)}>Abort</button>
                    </div>
                </header>

                <div className="glass" style={{ padding: '3rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '2.5rem', lineHeight: '1.4' }}>{q.questionText}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {q.options.map((opt, i) => (
                            <div
                                key={i}
                                onClick={() => handleAnswer(q.id, opt)}
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderRadius: '12px',
                                    background: currentAnswer === opt ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                    border: `1px solid ${currentAnswer === opt ? 'var(--primary)' : 'var(--border)'}`,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: `2px solid ${currentAnswer === opt ? 'var(--primary)' : 'var(--text-muted)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {currentAnswer === opt && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />}
                                </div>
                                <span style={{ fontSize: '1.1rem' }}>{opt}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button
                        className="btn-secondary"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex(c => c - 1)}
                    >
                        Previous
                    </button>

                    {currentIndex === currentQuestions.length - 1 ? (
                        <button className="btn-primary" style={{ background: 'var(--success)', border: 'none' }} onClick={handleFinish}>
                            Complete Test
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={() => setCurrentIndex(c => c + 1)}>
                            Next Question <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderResult = () => (
        <div className="layout-container" style={{ maxWidth: '1000px' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass"
                style={{ padding: '4rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto 3rem' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)', filter: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.3))' }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                        <motion.path
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${result.percentage}, 100` }}
                            transition={{ duration: 2, ease: "backOut" }}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="url(#grad1)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 1 }} />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            style={{ fontSize: '4rem', fontWeight: '900', background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}
                        >
                            {result.percentage}%
                        </motion.h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', letterSpacing: '2px', fontWeight: '600' }}>OVERALL GRADE</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '800' }}>Practice Session Analysis</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '4rem' }}>
                        <div style={{ padding: '1rem 2rem', borderRadius: '100px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Trophy size={20} color="var(--primary)" />
                            <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>Final Score: {result.score} / {result.totalMarks}</span>
                        </div>
                    </div>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '5rem' }}>
                    {[
                        { label: 'Accuracy', val: `${result.percentage}%`, icon: <Target size={24} />, color: '#6366f1' },
                        { label: 'Correct', val: result.feedback.filter(f => f.isCorrect).length, icon: <CheckCircle2 size={24} />, color: '#10b981' },
                        { label: 'Efficiency', val: 'Fast', icon: <Clock size={24} />, color: '#f59e0b' },
                        { label: 'Total Items', val: result.feedback.length, icon: <Layout size={24} />, color: '#ec4899' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem 1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}
                        >
                            <div style={{ color: stat.color, marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>{stat.val}</h3>
                        </motion.div>
                    ))}
                </div>

                <div style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                            Detailed Question Review
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
                        {result.feedback.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + i * 0.1 }}
                                className="glass"
                                style={{
                                    padding: '2rem',
                                    background: f.isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(244, 63, 94, 0.03)',
                                    border: `1px solid ${f.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}`,
                                    borderRadius: '24px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <p style={{ fontWeight: '700', fontSize: '1.2rem', lineHeight: '1.5', maxWidth: '80%' }}>{f.questionText}</p>
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '12px',
                                        background: f.isCorrect ? 'var(--success)' : 'var(--error)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        textTransform: 'uppercase'
                                    }}>
                                        {f.isCorrect ? 'Correct' : 'Incorrect'}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>YOUR RESPONSE</p>
                                        <p style={{ fontWeight: '600', color: f.isCorrect ? 'var(--success)' : 'var(--error)' }}>{f.yourAnswer || 'No answer provided'}</p>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>CORRECT ANSWER</p>
                                        <p style={{ fontWeight: '600', color: 'var(--success)' }}>{f.correctAnswer}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <button
                        className="btn-primary"
                        style={{ padding: '1.25rem 4rem', fontSize: '1.1rem', borderRadius: '16px' }}
                        onClick={() => {
                            setResult(null);
                            setShowTest(false);
                            fetchTopics();
                        }}
                    >
                        Finish Review
                    </button>
                </div>
            </motion.div>
        </div>
    );


    return (
        <AnimatePresence mode="wait">
            {!showTest ? renderSelection() : renderTest()}
        </AnimatePresence>
    );
};

export default SelfPractice;
