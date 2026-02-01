import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService, examService } from '../services/api';
import { User, Mail, Phone, Lock, Save, ArrowLeft, ShieldCheck, Trophy, Target, BarChart3, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        student_id: '',
        mobile_number: '',
        password: ''
    });
    const [stats, setStats] = useState({
        totalExams: 0,
        averageScore: 0,
        completedExams: 0,
        lastTestScore: 0,
        recentExams: []
    });

    useEffect(() => {
        fetchProfile();
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await examService.getAssignedExams();
            if (res.success) {
                const exams = res.data.exams || [];
                const completed = exams.filter(e => e.status === 'submitted');
                const avg = completed.length > 0
                    ? completed.reduce((acc, curr) => acc + (curr.score || 0), 0) / completed.length
                    : 0;

                // Find last submitted exam
                const lastTest = completed.length > 0 ? completed[0] : null;

                setStats({
                    totalExams: exams.length,
                    averageScore: Math.round(avg),
                    completedExams: completed.length,
                    lastTestScore: lastTest ? lastTest.score : 0,
                    recentExams: exams.slice(0, 5)
                });
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success) {
                setProfile({
                    ...res.data.profile,
                    password: ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await profileService.updateProfile({
                name: profile.name,
                mobile_number: profile.mobile_number,
                password: profile.password || undefined
            });
            if (res.success) {
                alert('Profile updated successfully!');
                // Update local storage user name if changed
                const localUser = JSON.parse(localStorage.getItem('student_user') || '{}');
                localUser.name = profile.name;
                localStorage.setItem('student_user', JSON.stringify(localUser));
                setProfile(prev => ({ ...prev, password: '' }));
            }
        } catch (err) {
            alert('Failed to update profile: ' + (err.response?.data?.message || 'Error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="layout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Synchronizing Profile...</p>
        </div>
    </div>;

    return (
        <div className="layout-container" style={{ maxWidth: '1200px' }}>
            <header style={{ marginBottom: '4rem' }}>
                <button
                    onClick={() => navigate('/portal')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}
                >
                    <ArrowLeft size={16} /> Return to Dashboard
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '35px',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '3rem',
                                fontWeight: '900',
                                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                                border: '4px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {profile.name.charAt(0).toUpperCase()}
                        </motion.div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1px' }}>{profile.name}</h1>
                                <span style={{ padding: '0.4rem 1rem', borderRadius: '100px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px' }}>
                                    {stats.averageScore >= 80 ? 'ELITE SCHOLAR' : stats.averageScore >= 60 ? 'PRO PERFORMER' : 'ACTIVE LEARNER'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={18} /> ID: {profile.student_id}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={18} /> {profile.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '3rem' }}>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Interaction - Stats Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <motion.div whileHover={{ y: -5 }} className="glass" style={{ padding: '2rem 1.5rem', textAlign: 'center', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.05)' }}>
                            <Trophy size={28} color="#6366f1" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>{stats.averageScore}%</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>AVG SCORE</p>
                        </motion.div>
                        <motion.div whileHover={{ y: -5 }} className="glass" style={{ padding: '2rem 1.5rem', textAlign: 'center', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.05)' }}>
                            <BarChart3 size={28} color="#10b981" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>{stats.completedExams}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>COMPLETED</p>
                        </motion.div>
                    </div>

                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <User size={20} color="var(--primary)" /> Profile Security
                        </h3>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>DISPLAY NAME</label>
                                <input
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    style={{ background: 'rgba(255,255,255,0.02)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>MOBILE CONTACT</label>
                                <input
                                    value={profile.mobile_number || ''}
                                    onChange={e => setProfile({ ...profile, mobile_number: e.target.value })}
                                    style={{ background: 'rgba(255,255,255,0.02)' }}
                                    placeholder="+91 0000000000"
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>NEW PASSWORD</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                    <input
                                        type="password"
                                        value={profile.password}
                                        onChange={e => setProfile({ ...profile, password: e.target.value })}
                                        style={{ paddingLeft: '3rem', background: 'rgba(255,255,255,0.02)' }}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <button className="btn-primary" disabled={saving} style={{ marginTop: '1rem', padding: '1.25rem' }}>
                                <Save size={18} /> {saving ? 'Applying Changes...' : 'Update Settings'}
                            </button>
                        </form>
                    </div>
                </aside>

                <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Performance Breakdown Section */}
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Learning Progress</h3>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>Overall Strength</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontWeight: '700' }}>
                                    <span>Last Test Performance</span>
                                    <span style={{ color: 'var(--primary)' }}>{stats.lastTestScore}%</span>
                                </div>
                                <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.lastTestScore}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: '10px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Clock size={20} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>TOTAL TIME</p>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{stats.completedExams * 45} Mins</h4>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Target size={20} color="#10b981" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>SUCCESS RATE</p>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{Math.round((stats.completedExams / (stats.totalExams || 1)) * 100)}%</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Action */}
                    <div className="glass" style={{ padding: '2.5rem', borderRadius: '32px' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>Academic Timeline</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {stats.recentExams.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No records available yet. Start an exam to see your history.
                                </div>
                            ) : (
                                stats.recentExams.map((exam, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ x: 10 }}
                                        style={{
                                            padding: '1.5rem',
                                            borderRadius: '24px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '18px',
                                                background: exam.status === 'submitted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.25rem'
                                            }}>
                                                {exam.status === 'submitted' ? '🎉' : '⏳'}
                                            </div>
                                            <div>
                                                <h4 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{exam.exam_title}</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exam.session_name} • {new Date(exam.start_time).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: exam.status === 'submitted' ? '#10b981' : '#f59e0b' }}>
                                                {exam.status === 'submitted' ? `${exam.score} Marks` : 'Pending'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                                                {exam.status === 'submitted' ? 'QUALIFIED' : 'ACTION REQUIRED'}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;
