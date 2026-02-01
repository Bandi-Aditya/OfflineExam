import React, { useState, useEffect } from 'react';
import { sessionService, examService } from '../services/api';
import { Plus, Play, Pause, Monitor, Users, Calendar, Activity, X, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Sessions = () => {
    const [sessions, setSessions] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newSession, setNewSession] = useState({
        examId: '',
        sessionName: '',
        startTime: '',
        endTime: '',
        labName: '',
        mode: 'offline',
        classroom: '',
        floor: '',
        block: ''
    });
    const [editingSession, setEditingSession] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sessRes, examRes] = await Promise.all([
                sessionService.getSessions(),
                examService.getExams()
            ]);
            setSessions(sessRes.data.sessions || []);
            setExams(examRes.data.exams || []);
        } catch (err) {
            console.error('Error fetching sessions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (editingSession) {
                await sessionService.updateSession(editingSession.id, newSession);
            } else {
                await sessionService.createSession(newSession);
            }
            setShowModal(false);
            setEditingSession(null);
            resetNewSession();
            fetchData();
        } catch (err) {
            alert(editingSession ? 'Failed to update session' : 'Failed to create session');
        }
    };

    const handleEditSession = (session) => {
        setEditingSession(session);
        setNewSession({
            examId: session.exam?._id || session.examId,
            sessionName: session.session_name,
            startTime: session.start_time ? new Date(session.start_time).toISOString().slice(0, 16) : '',
            endTime: session.end_time ? new Date(session.end_time).toISOString().slice(0, 16) : '',
            labName: session.lab_name || '',
            mode: session.mode || 'offline',
            classroom: session.classroom || '',
            floor: session.floor || '',
            block: session.block || ''
        });
        setShowModal(true);
    };

    const resetNewSession = () => {
        setNewSession({
            examId: '',
            sessionName: '',
            startTime: '',
            endTime: '',
            labName: '',
            mode: 'offline',
            classroom: '',
            floor: '',
            block: ''
        });
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await sessionService.toggleSession(id, !currentStatus);
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDeleteSession = async (id) => {
        if (!confirm('Are you sure you want to delete this session? All student attempt data for this session will be lost.')) return;
        try {
            await sessionService.deleteSession(id);
            fetchData();
        } catch (err) {
            alert('Failed to delete session');
        }
    };

    return (
        <div className="animate-fade">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Active Sessions</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage live lab deployments and schedule upcoming examinations.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <Plus size={20} /> Schedule Session
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '2rem' }}>
                {loading ? (
                    <div style={{ padding: '2rem' }}>Loading state...</div>
                ) : sessions.length === 0 ? (
                    <div className="glass" style={{ padding: '4rem', gridColumn: '1/-1', textAlign: 'center' }}>
                        <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3 style={{ color: 'var(--text-muted)' }}>No sessions currently active or scheduled.</h3>
                    </div>
                ) : sessions.map(session => (
                    <motion.div
                        key={session.id}
                        layout
                        className="glass"
                        style={{ padding: '2rem', borderTop: `4px solid ${session.is_active ? 'var(--success)' : 'var(--border)'}` }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '700' }}>{session.session_name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                                    <Activity size={16} /> {session.exam_title}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <span className={`badge ${session.is_active ? 'badge-success' : 'badge-error'}`} style={{ height: 'fit-content' }}>
                                    {session.is_active ? 'LIVE & BROADCASTING' : 'OFFLINE'}
                                </span>
                                <button
                                    onClick={() => handleEditSession(session)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--primary)', padding: '0', cursor: 'pointer' }}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteSession(session.id)}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--error)', padding: '0', cursor: 'pointer' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px' }}>
                                    <Monitor size={18} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Lab</p>
                                    <p style={{ fontWeight: '600' }}>{session.lab_name || 'Virtual Lab'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px' }}>
                                    <Users size={18} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance</p>
                                    <p style={{ fontWeight: '600' }}>{session.submitted_count || 0} / {session.total_students || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => handleToggle(session.id, session.is_active)}
                                className={session.is_active ? 'btn-secondary' : 'btn-primary'}
                                style={{
                                    flex: 1,
                                    borderColor: session.is_active ? 'var(--error)' : '',
                                    color: session.is_active ? 'var(--error)' : ''
                                }}
                            >
                                {session.is_active ? <Pause size={18} /> : <Play size={18} />}
                                {session.is_active ? 'End Deployment' : 'Start Broadcast'}
                            </button>
                            <Link to="/monitoring" style={{ flex: 1, textDecoration: 'none' }}>
                                <button className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Monitor size={18} /> Live Stream
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ width: '550px', padding: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.75rem' }}>{editingSession ? 'Edit Session' : 'Deploy New Session'}</h2>
                                <button onClick={() => { setShowModal(false); setEditingSession(null); resetNewSession(); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <input
                                    placeholder="Deployment Name (e.g., Computer Center A)"
                                    value={newSession.sessionName}
                                    onChange={e => setNewSession({ ...newSession, sessionName: e.target.value })}
                                    required
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <select
                                        value={newSession.examId}
                                        onChange={e => setNewSession({ ...newSession, examId: e.target.value })}
                                        required
                                        style={{ gridColumn: 'span 1' }}
                                    >
                                        <option value="">Select Exam Package</option>
                                        {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                    </select>
                                    <select
                                        value={newSession.mode || 'offline'}
                                        onChange={e => setNewSession({ ...newSession, mode: e.target.value })}
                                        required
                                        style={{ gridColumn: 'span 1' }}
                                    >
                                        <option value="offline">Offline (On-Premise)</option>
                                        <option value="online">Online (Remote)</option>
                                    </select>
                                </div>

                                {newSession.mode === 'online' ? (
                                    <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                            <Monitor size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                            Online Mode: Students can access the exam remotely via their portal. No physical location required.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                        <input
                                            placeholder="Block Name"
                                            value={newSession.block || ''}
                                            onChange={e => setNewSession({ ...newSession, block: e.target.value })}
                                            style={{ gridColumn: 'span 3' }}
                                        />
                                        <input
                                            placeholder="Floor No."
                                            value={newSession.floor || ''}
                                            onChange={e => setNewSession({ ...newSession, floor: e.target.value })}
                                        />
                                        <input
                                            placeholder="Room No."
                                            value={newSession.classroom || ''}
                                            onChange={e => setNewSession({ ...newSession, classroom: e.target.value })}
                                        />
                                        <input
                                            placeholder="Lab Name"
                                            value={newSession.labName || ''}
                                            onChange={e => setNewSession({ ...newSession, labName: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Start Window</label>
                                        <input type="datetime-local" onChange={e => setNewSession({ ...newSession, startTime: e.target.value })} required />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Expiration Target</label>
                                        <input type="datetime-local" onChange={e => setNewSession({ ...newSession, endTime: e.target.value })} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                    {editingSession ? 'Update Deployment' : 'Confirm Deployment'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sessions;
