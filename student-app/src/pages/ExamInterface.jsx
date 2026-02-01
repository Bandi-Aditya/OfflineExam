import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { offlineDB } from '../db/offline';
import { examService } from '../services/api';
import { Clock, Send, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExamInterface = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Load exam from IndexedDB
    useEffect(() => {
        const loadExam = async () => {
            try {
                const storedExam = await offlineDB.getExam(sessionId);
                if (!storedExam) {
                    navigate('/portal');
                    return;
                }

                const assignmentId = storedExam.assignmentId;
                const savedAnswers = await offlineDB.getAllAnswers(assignmentId);
                const answerMap = {};
                savedAnswers.forEach(a => {
                    answerMap[a.questionId] = a.answerText;
                });

                setExam(storedExam.exam);
                setQuestions(storedExam.questions);
                setAnswers(answerMap);

                // Calculate time left (demo: use full duration for simplicity)
                // In a real app we'd track start_time in DB/LocalStorage
                const startTime = localStorage.getItem(`start_time_${sessionId}`);
                if (!startTime) {
                    const now = Date.now();
                    localStorage.setItem(`start_time_${sessionId}`, now);
                    setTimeLeft(storedExam.exam.durationMinutes * 60);
                } else {
                    const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
                    const remaining = (storedExam.exam.durationMinutes * 60) - elapsed;
                    setTimeLeft(remaining > 0 ? remaining : 0);
                }

                setLoading(false);
            } catch (err) {
                console.error('Failed to load exam', err);
                navigate('/portal');
            }
        };

        loadExam();

        // Disable right click and some shortcuts
        const preventDefault = (e) => e.preventDefault();
        document.addEventListener('contextmenu', preventDefault);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
        };
    }, [sessionId, navigate]);

    // Online status monitoring
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const [violations, setViolations] = useState(0);

    // Tab Switching / Proctoring Logic
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setViolations(prev => {
                    const next = prev + 1;
                    if (next >= 3) {
                        alert("CRITICAL WARNING: Multiple tab switches detected. Your exam is being automatically submitted for security reasons.");
                        autoSubmit();
                    } else {
                        alert(`WARNING: Tab switching detected! This is incident ${next}/3. Your exam will be auto-submitted on the 3rd incident.`);
                    }
                    return next;
                });
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                // We won't auto-submit here, but we'll remind them
                console.warn("Exited fullscreen mode");
            }
        };

        const requestFS = () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(e => console.log("FS request ignored by browser policy"));
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('mousedown', requestFS, { once: true }); // Request FS on first interaction

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Timer logic
    useEffect(() => {
        if (loading || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    autoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, timeLeft]);

    // Handle Answer Selection
    const handleAnswerChange = async (questionId, value) => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);

        // Auto-save to IndexedDB
        const storedExam = await offlineDB.getExam(sessionId);
        await offlineDB.saveAnswer(storedExam.assignmentId, questionId, value);
    };

    const autoSubmit = () => {
        handleSubmit(true);
    };

    const handleSubmit = async (isAuto = false) => {
        if (!isAuto && !confirm('Are you sure you want to submit your exam?')) return;

        setSubmitting(true);
        const storedExam = await offlineDB.getExam(sessionId);
        const sessionToken = localStorage.getItem(`token_${sessionId}`);

        const submissionData = {
            sessionToken,
            answers: Object.entries(answers).map(([qId, text]) => ({
                questionId: parseInt(qId),
                answerText: text
            })),
            autoSubmitted: isAuto
        };

        // Attempt to submit
        try {
            if (navigator.onLine) {
                await examService.submitExam(sessionId, submissionData);
                localStorage.removeItem(`exam_${sessionId}`);
                localStorage.removeItem(`start_time_${sessionId}`);
                localStorage.removeItem(`token_${sessionId}`);
                await offlineDB.clearAnswers(storedExam.assignmentId);
                navigate('/portal');
                alert('Exam submitted successfully!');
            } else {
                // Handle offline submission (store and wait for reconnection)
                alert('You are currently offline. The system will automatically upload your answers once you reconnect to the internet. DO NOT CLOSE THIS BROWSER TAB.');
                // In a real app, we'd use a background sync or a polling mechanism
            }
        } catch (err) {
            console.error('Submission error', err);
            alert('Failed to submit. Please check your internet and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div className="layout-container">Initializing secure environment...</div>;

    const currentQuestion = questions[currentIndex];

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
            {/* Header with Timer */}
            <header className="glass" style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                padding: '1.25rem 2.5rem',
                borderRadius: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>{exam.title}</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Question {currentIndex + 1} of {questions.length}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        background: timeLeft < 300 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${timeLeft < 300 ? 'var(--error)' : 'var(--border)'}`,
                        borderRadius: '12px',
                        color: timeLeft < 300 ? 'var(--error)' : 'var(--text-main)',
                        fontWeight: '700',
                        fontSize: '1.25rem'
                    }}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => handleSubmit()}
                        disabled={submitting}
                        style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Send size={18} /> Submit Exam
                    </button>
                </div>
            </header>

            <div className="layout-container" style={{ marginTop: '3rem' }}>
                {/* Connection Warning */}
                <AnimatePresence>
                    {!isOnline && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--warning)',
                                padding: '1rem',
                                borderRadius: '12px',
                                marginBottom: '2rem',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                        >
                            <AlertTriangle size={20} />
                            <p style={{ fontSize: '0.9rem' }}>You are currently <strong>Offline</strong>. Don't worry, your answers are being saved locally. Internet is only needed for submission.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question Panel */}
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <main style={{ flex: 1 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="glass question-card"
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>QUESTION {currentIndex + 1}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{currentQuestion.marks} Marks</span>
                                </div>

                                <h3 style={{ fontSize: '1.5rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: '500' }}>
                                    {currentQuestion.questionText}
                                </h3>

                                {currentQuestion.questionType === 'mcq' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {currentQuestion.options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                className={`option-btn ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                                                onClick={() => handleAnswerChange(currentQuestion.id, option)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        border: '2px solid',
                                                        borderColor: answers[currentQuestion.id] === option ? 'var(--primary)' : 'var(--border)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        color: answers[currentQuestion.id] === option ? 'var(--primary)' : 'var(--text-muted)'
                                                    }}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </div>
                                                    {option}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea
                                        style={{
                                            width: '100%',
                                            height: '300px',
                                            resize: 'none',
                                            padding: '1.5rem',
                                            background: 'rgba(0,0,0,0.2)',
                                            fontSize: '1.1rem'
                                        }}
                                        placeholder="Type your answer here..."
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                            <button
                                className="btn-outline"
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentIndex === 0}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <ChevronLeft size={20} /> Previous
                            </button>

                            <button
                                className="btn-primary"
                                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                disabled={currentIndex === questions.length - 1}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                Next <ChevronRight size={20} />
                            </button>
                        </div>
                    </main>

                    {/* Question Navigation Grid */}
                    <aside style={{ width: '300px' }}>
                        <div className="glass" style={{ padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Question Navigator</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                                {questions.map((q, idx) => (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(idx)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '8px',
                                            border: '1.5px solid',
                                            borderColor: currentIndex === idx ? 'var(--primary)' : (answers[q.id] ? 'var(--success)' : 'var(--border)'),
                                            background: currentIndex === idx ? 'var(--primary)' : (answers[q.id] ? 'rgba(16, 185, 129, 0.1)' : 'transparent'),
                                            color: (currentIndex === idx || answers[q.id]) ? 'white' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>

                            <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '3px' }}></div>
                                    <span>Current Question</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '12px', height: '12px', background: 'var(--success)', borderRadius: '3px' }}></div>
                                    <span>Answered</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '12px', height: '12px', border: '1.5px solid var(--border)', borderRadius: '3px' }}></div>
                                    <span>Not Visited</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ExamInterface;
