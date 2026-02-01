import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService, cryptoUtils, authService } from '../services/api';
import { offlineDB } from '../db/offline';
import { LogOut, Download, Play, CheckCircle, Info, Wifi, WifiOff, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const ExamCard = ({ exam, onDownload, onStart, onViewResult }) => {
    const isDownloaded = localStorage.getItem(`exam_${exam.session_id}`) !== null;
    const isSubmitted = exam.status === 'submitted';

    return (
        <div className="glass" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{exam.exam_title}</h3>
                    <span style={{
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '100px',
                        background: isSubmitted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: isSubmitted ? 'var(--success)' : 'var(--primary)',
                        fontWeight: '600'
                    }}>
                        {isSubmitted ? 'COMPLETED' : exam.session_name}
                    </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', maxWidth: '500px' }}>
                    {exam.description || 'No description provided.'}
                </p>
                <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Play size={14} /> {exam.duration_minutes} Minutes
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={14} /> {exam.total_marks} Marks
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                {isSubmitted && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn-secondary"
                            onClick={() => onViewResult(exam.session_id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <CheckCircle size={18} /> View Result
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => onStart(exam.session_id)} // Re-use start for retake, logic handled in start
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Play size={18} /> Retake Exam
                        </button>
                    </div>
                )}

                {!isSubmitted && (
                    !isDownloaded ? (
                        <button
                            className="btn-primary"
                            onClick={() => onDownload(exam.session_id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                            <Download size={18} /> Download
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={() => onStart(exam.session_id)}
                            style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                            <Play size={18} /> Start Exam
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

const Portal = () => {
    const [exams, setExams] = useState([]);
    const [online, setOnline] = useState(navigator.onLine);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('student_user') || '{}');

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOffline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        fetchExams();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await examService.getAssignedExams();
            setExams(res.data.exams);
        } catch (err) {
            console.error('Failed to fetch exams', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (sessionId) => {
        if (!online) {
            alert('You need internet connection to download the exam.');
            return;
        }

        try {
            const res = await examService.downloadExam(sessionId);
            const encryptedExam = res.data.encryptedExam;

            // Decrypt to verify then save to IndexedDB
            const examData = cryptoUtils.decryptExam(encryptedExam);
            await offlineDB.saveExam(sessionId, examData);

            localStorage.setItem(`exam_${sessionId}`, 'downloaded');
            localStorage.setItem(`token_${sessionId}`, examData.sessionToken);

            fetchExams(); // Refresh UI
            alert('Exam downloaded successfully! You can now start the exam even if internet goes out.');
        } catch (err) {
            alert('Download failed. ' + (err.response?.data?.message || ''));
        }
    };

    const handleStart = (sessionId) => {
        if (confirm('Once the exam starts, you must complete it. Are you ready?')) {
            navigate(`/exam/${sessionId}`);
        }
    };

    const handleViewResult = (sessionId) => {
        navigate(`/result/${sessionId}`);
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            authService.logout();
            navigate('/');
        }
    };

    if (loading) return <div className="layout-container">Loading your profile...</div>;

    return (
        <div className="layout-container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
                <div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Welcome back,</p>
                    <h1 style={{ fontSize: '2rem' }}>{user.name}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>ID: {user.studentId}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '100px',
                        background: online ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        color: online ? 'var(--success)' : 'var(--error)',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        {online ? <Wifi size={16} /> : <WifiOff size={16} />}
                        {online ? 'Online' : 'Offline Mode'}
                    </div>

                    <button
                        onClick={() => navigate('/practice')}
                        style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                        <BookOpen size={18} /> Self Practice
                    </button>

                    <button
                        onClick={() => navigate('/profile')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <User size={18} /> Profile
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <LogOut size={18} /> Sign Out
                    </button>

                </div>
            </header>

            <main>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem' }}>Your Assigned Exams</h2>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                {exams.length === 0 ? (
                    <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No exams assigned yet.
                    </div>
                ) : (
                    exams.map(exam => (
                        <ExamCard
                            key={exam.session_id}
                            exam={exam}
                            onDownload={handleDownload}
                            onStart={handleStart}
                            onViewResult={handleViewResult}
                        />
                    ))
                )}
            </main>

            <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <p>© 2026 Secure Examination System. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Portal;
