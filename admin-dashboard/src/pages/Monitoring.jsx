import React, { useState, useEffect } from 'react';
import { Shield, Activity, Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sessionService } from '../services/api';

const Monitoring = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [students, setStudents] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Fetch all sessions on mount
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await sessionService.getSessions();
                if (res.data?.sessions) {
                    setSessions(res.data.sessions);
                    // Auto-select the most recent active session, or the first session if none active
                    const activeSession = res.data.sessions.find(s => s.is_active);
                    if (activeSession) {
                        setSelectedSessionId(activeSession.id);
                    } else if (res.data.sessions.length > 0) {
                        setSelectedSessionId(res.data.sessions[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch sessions", error);
            }
        };
        fetchSessions();
    }, []);

    // Poll for live status of selected session
    useEffect(() => {
        if (!selectedSessionId) {
            setStudents([]);
            return;
        }

        const fetchLiveStatus = async () => {
            try {
                const res = await sessionService.getLiveStatus(selectedSessionId);
                const liveData = res.data?.students || [];

                // Map backend data to UI format
                const mappedStudents = liveData.map(s => {
                    // Calculate progress
                    const total = s.total_questions || 0;
                    const answered = s.answered_count || 0;
                    const progress = total > 0 ? Math.round((answered / total) * 100) : 0;

                    // Determine status logic
                    // Backend statuses: 'pending', 'in_progress', 'submitted'
                    let displayStatus = 'offline';
                    if (s.status === 'in_progress') displayStatus = 'online';
                    if (s.status === 'submitted') displayStatus = 'completed';
                    if (s.status === 'pending') displayStatus = 'offline';

                    return {
                        id: s.student_id || 'UNKNOWN',
                        assignment_id: s.id, // Internal assignment ID
                        name: s.name || 'Unknown Student',
                        status: displayStatus,
                        rawStatus: s.status,
                        progress: progress,
                        alerts: 0, // Backend doesn't support alerts yet
                        lastSync: s.submit_time ? 'Submitted' : (s.start_time ? 'Active' : 'Not Started'),
                        startTime: s.start_time
                    };
                });

                setStudents(mappedStudents);
                setLastUpdated(new Date());
            } catch (error) {
                console.error("Failed to fetch live status", error);
            }
        };

        fetchLiveStatus(); // Initial fetch
        const interval = setInterval(fetchLiveStatus, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [selectedSessionId]);

    const stats = {
        online: students.filter(s => s.status === 'online').length,
        offline: students.filter(s => s.status === 'offline').length,
        completed: students.filter(s => s.status === 'completed').length,
        alerts: students.reduce((acc, s) => acc + s.alerts, 0)
    };

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Live Monitoring</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Real-time supervision of active exam sessions.</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <select
                            className="input-field"
                            style={{ paddingRight: '2.5rem', minWidth: '250px', cursor: 'pointer' }}
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                        >
                            <option value="" disabled>Select a Session</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.session_name} {s.is_active ? '(Active)' : '(Inactive)'}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={18} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>

                    <button
                        className="btn-secondary"
                        onClick={() => setSelectedSessionId(prev => prev)} // Trigger re-render/effect
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={18} /> Refresh
                    </button>
                </div>
            </header>

            {!selectedSessionId ? (
                <div className="glass" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Shield size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                    <h3>No Session Selected</h3>
                    <p>Please select an exam session from the dropdown above to start monitoring.</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Wifi color="var(--success)" />
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Active (Online)</p>
                                    <h2 style={{ fontSize: '1.5rem' }}>{stats.online} <span style={{ fontSize: '0.875rem', fontWeight: '400' }}>/ {students.length}</span></h2>
                                </div>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <CheckCircle color="var(--primary)" />
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Completed</p>
                                    <h2 style={{ fontSize: '1.5rem' }}>{stats.completed}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <WifiOff color="var(--warning)" />
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending/Offline</p>
                                    <h2 style={{ fontSize: '1.5rem' }}>{stats.offline}</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Activity size={20} color="var(--primary)" /> Active Student Grid
                        </span>
                        {lastUpdated && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        <AnimatePresence>
                            {students.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No students assigned to this session.
                                </div>
                            ) : (
                                students.map((student) => (
                                    <motion.div
                                        key={student.id + student.assignment_id}
                                        layout
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="glass"
                                        style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'var(--border)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '700'
                                                }}>
                                                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1rem' }}>{student.name}</h3>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {student.id}</p>
                                                </div>
                                            </div>
                                            <span className={`badge ${student.status === 'online' ? 'badge-success' :
                                                    student.status === 'completed' ? 'badge-primary' : 'badge-warning'
                                                }`}>
                                                {student.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Exam Progress</span>
                                                <span>{student.progress}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${student.progress}%` }}
                                                    transition={{ duration: 1 }}
                                                    style={{
                                                        height: '100%',
                                                        background: `linear-gradient(90deg, var(--primary), var(--secondary))`,
                                                        borderRadius: '10px'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: student.alerts > 0 ? 'var(--error)' : 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                                {student.alerts > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                                {student.alerts > 0 ? `${student.alerts} Incidents` : 'No Incidents'}
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {student.lastSync}
                                                </span>
                                            </div>
                                        </div>

                                        {student.alerts > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '4px',
                                                background: 'var(--error)',
                                                boxShadow: '0 0 10px var(--error)'
                                            }} />
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}

            <div className="glass" style={{ marginTop: '3rem', padding: '2rem', textAlign: 'center' }}>
                <Shield size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Monitoring Active</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', maxWidth: '500px', marginInline: 'auto' }}>
                    Real-time updates are polling every 10 seconds. Student progress and status will be updated automatically.
                </p>
            </div>
        </div>
    );
};

export default Monitoring;
