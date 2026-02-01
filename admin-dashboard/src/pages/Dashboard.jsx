import React, { useEffect, useState } from 'react';
import { examService, sessionService } from '../services/api';
import { FileText, Users, Clock, CheckCircle, TrendingUp, ArrowUpRight, Calendar, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const StatCard = ({ icon, label, value, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="glass"
        style={{ padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: '240px' }}
    >
        <div style={{ padding: '1rem', background: `${color}15`, borderRadius: '16px', border: `1px solid ${color}30` }}>
            {React.cloneElement(icon, { color: color, size: 28 })}
        </div>
        <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>{label}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem' }}>{value}</h3>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalExams: 0,
        activeSessions: 0,
        totalStudents: 142,
        avgPassingRate: '88%'
    });
    const [recentExams, setRecentExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const examsRes = await examService.getExams();
                const sessionsRes = await sessionService.getSessions();
                const studentsRes = await sessionService.getAllStudents();

                const exams = examsRes.data.exams || [];
                const sessions = sessionsRes.data.sessions || [];
                const activeSessionsCount = sessions.filter(s => s.is_active).length;
                const totalStudentsCount = studentsRes.data.students?.length || 0;

                setRecentExams(exams.slice(0, 5));
                setStats(prev => ({
                    ...prev,
                    totalExams: exams.length,
                    activeSessions: activeSessionsCount,
                    totalStudents: totalStudentsCount
                }));
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>System Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Welcome back, administrator. Here's a summary of the exam ecosystem.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
                        <Calendar size={18} color="var(--primary)" />
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
                <StatCard icon={<FileText />} label="Master Exams" value={stats.totalExams} color="#6366f1" delay={0.1} />
                <StatCard icon={<Clock />} label="Live Sessions" value={stats.activeSessions} color="#06b6d4" delay={0.2} />
                <StatCard icon={<Users />} label="Active Students" value={stats.totalStudents} color="#10b981" delay={0.3} />
                <StatCard icon={<TrendingUp />} label="Success Rate" value={stats.avgPassingRate} color="#f59e0b" delay={0.4} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CheckCircle size={22} color="var(--success)" /> Recent Exam Packages
                        </h2>
                        <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View Repository</button>
                    </div>

                    <div className="glass" style={{ padding: '0.5rem' }}>
                        <table style={{ margin: '0' }}>
                            <thead>
                                <tr>
                                    <th>Exam Title</th>
                                    <th>Duration</th>
                                    <th>Questions</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentExams.map((exam) => (
                                    <tr key={exam.id}>
                                        <td style={{ fontWeight: '600' }}>{exam.title}</td>
                                        <td>{exam.duration_minutes} mins</td>
                                        <td>{exam.question_count} Items</td>
                                        <td>
                                            <span className={`badge ${exam.is_active ? 'badge-success' : 'badge-error'}`}>
                                                {exam.is_active ? 'Production' : 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)' }}>
                                                <ArrowUpRight size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Info size={18} color="var(--primary)" /> Quick Launch
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Link to="/exams" style={{ textDecoration: 'none' }}>
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
                                    Create New Exam <ArrowUpRight size={18} />
                                </button>
                            </Link>
                            <Link to="/sessions" style={{ textDecoration: 'none' }}>
                                <button className="btn-secondary" style={{ width: '100%', textAlign: 'left' }}>
                                    Schedule Lab Session
                                </button>
                            </Link>
                            <Link to="/students" style={{ textDecoration: 'none' }}>
                                <button className="btn-secondary" style={{ width: '100%', textAlign: 'left' }}>
                                    Register New Student
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent)' }}>
                        <h4 style={{ color: 'var(--primary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Service Status</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
                            <span style={{ fontSize: '0.9rem' }}>API Gateway: Online</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
                            <span style={{ fontSize: '0.9rem' }}>DB Cluster: Healthy</span>
                        </div>
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};

export default Dashboard;

