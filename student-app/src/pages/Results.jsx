import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { examService } from '../services/api';
import { Award, CheckCircle, XCircle, ArrowLeft, Download, Share2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Results = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await examService.getResult(sessionId);
                setResult(res.data.result);
            } catch (err) {
                console.error('Failed to fetch result', err);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [sessionId]);

    if (loading) return <div className="layout-container">Fetching your score...</div>;
    if (!result) return <div className="layout-container">Result not available yet.</div>;

    const isPassed = result.score >= result.passing_marks;
    const percentage = (result.total_marks > 0) ? (result.score / result.total_marks) * 100 : 0;

    return (
        <div className="layout-container" style={{ paddingTop: '2rem' }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass"
                style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}
            >
                <div style={{
                    width: '100px',
                    height: '100px',
                    background: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    color: isPassed ? 'var(--success)' : 'var(--error)'
                }}>
                    {isPassed ? <Award size={56} /> : <XCircle size={56} />}
                </div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    {isPassed ? 'Congratulations!' : 'Keep Trying!'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', marginBottom: '3rem' }}>
                    You have successfully completed the <strong>{result.exam_title}</strong>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                    <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your Score</p>
                        <h2 style={{ fontSize: '2rem' }}>{result.score} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {result.total_marks}</span></h2>
                    </div>
                    <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Percentage</p>
                        <h2 style={{ fontSize: '2rem' }}>{percentage.toFixed(1)}%</h2>
                    </div>
                </div>

                <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                    color: isPassed ? 'var(--success)' : 'var(--error)',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '3rem'
                }}>
                    {isPassed ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    STATUS: {result.result.toUpperCase()}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <Link to="/portal" className="btn-outline" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={20} /> Back to Portal
                    </Link>
                    {isPassed && (
                        <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Download size={20} /> Download Certificate
                        </button>
                    )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Exam submitted at: {new Date(result.submit_time).toLocaleString()}
                    {result.auto_submitted && <span style={{ color: 'var(--warning)', marginLeft: '0.5rem' }}>(Auto-Submitted)</span>}
                </p>
            </motion.div>

            {/* Answers Section - Only shown after exam has ended */}
            {!result.exam_has_ended && (
                <div className="glass" style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto', textAlign: 'center' }}>
                    <Clock size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>Answer Key Not Available Yet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        The correct answers and your responses will be displayed after the exam session ends.
                    </p>
                </div>
            )}

            {result.exam_has_ended && result.answers && result.answers.length > 0 && (
                <div className="glass" style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
                    <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Answer Review</h2>

                    {result.answers.map((answer, index) => (
                        <div
                            key={index}
                            className="glass"
                            style={{
                                padding: '1.5rem',
                                marginBottom: '1.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderLeft: `4px solid ${answer.is_correct ? 'var(--success)' : (answer.is_correct === null ? 'var(--warning)' : 'var(--error)')}`
                            }}
                        >
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                    <h4 style={{ fontSize: '1.1rem', flex: 1 }}>Q{index + 1}. {answer.question_text}</h4>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '100px',
                                        background: answer.is_correct ? 'rgba(16, 185, 129, 0.1)' : (answer.is_correct === null ? 'rgba(251, 191, 36, 0.1)' : 'rgba(244, 63, 94, 0.1)'),
                                        color: answer.is_correct ? 'var(--success)' : (answer.is_correct === null ? 'var(--warning)' : 'var(--error)'),
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                        marginLeft: '1rem'
                                    }}>
                                        {answer.marks_awarded}/{answer.total_marks} marks
                                    </span>
                                </div>

                                {answer.options && answer.options.length > 0 && (
                                    <div style={{ marginBottom: '0.75rem', paddingLeft: '1rem' }}>
                                        {answer.options.map((option, optIndex) => (
                                            <div
                                                key={optIndex}
                                                style={{
                                                    padding: '0.5rem',
                                                    marginBottom: '0.25rem',
                                                    borderRadius: '6px',
                                                    background: option === answer.correct_answer ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                                                    color: option === answer.correct_answer ? 'var(--success)' : 'var(--text-muted)'
                                                }}
                                            >
                                                {String.fromCharCode(65 + optIndex)}. {option}
                                                {option === answer.correct_answer && ' ✓'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Your Answer:</p>
                                    <p style={{ fontWeight: '600', color: answer.is_correct ? 'var(--success)' : 'var(--text)' }}>
                                        {answer.your_answer || <em style={{ color: 'var(--text-muted)' }}>Not answered</em>}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Correct Answer:</p>
                                    <p style={{ fontWeight: '600', color: 'var(--success)' }}>
                                        {answer.correct_answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Results;
