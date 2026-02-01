import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService } from '../services/api';
import { User, Mail, Shield, Save, ArrowLeft, Clock, History, AlertCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [studentData, setStudentData] = useState({
        name: '',
        email: '',
        studentId: '',
        mobileNumber: '',
        password: '',
    });

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            // We need to fetch student list to get basic details OR implement getStudentById
            // Since getAllStudents is already there, let's use that for basic details + getStudentHistory
            // Ideally backend should provide getStudentById. I'll stick to history for now and maybe filter from all students list if needed,
            // but for editing we need current data.
            // Let's assume getAllStudents is fast enough or add getStudentById to backend later.
            // For now, I'll filter from getAllStudents.

            const [studentsRes, historyRes] = await Promise.all([
                sessionService.getAllStudents(),
                sessionService.getStudentHistory(id)
            ]);

            const student = studentsRes.data.students.find(s => s.id === id);
            if (student) {
                setStudentData({
                    name: student.name,
                    email: student.email,
                    studentId: student.student_id,
                    mobileNumber: student.mobile_number || '',
                    password: '' // Don't show hash
                });
            }

            setHistory(historyRes.data.history || []);
        } catch (err) {
            console.error('Error fetching student details', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await sessionService.updateStudent(id, studentData);
            alert('Student details updated successfully');
            setStudentData(prev => ({ ...prev, password: '' })); // Clear password field
        } catch (err) {
            alert('Failed to update student');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading details...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="animate-fade">
            <header style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/students')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}
                >
                    <ArrowLeft size={18} /> Back to Directory
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.5rem' }}>
                        {studentData.name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{studentData.name}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>ID: {studentData.studentId} • <span className="badge badge-success">Active Candidate</span></p>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Edit Profile Section */}
                <section className="glass" style={{ padding: '2rem', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={20} color="var(--primary)" /> Profile Configuration
                    </h3>
                    <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Full Name</label>
                            <input
                                value={studentData.name}
                                onChange={e => setStudentData({ ...studentData, name: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Student ID</label>
                            <input
                                value={studentData.studentId}
                                onChange={e => setStudentData({ ...studentData, studentId: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    value={studentData.email}
                                    onChange={e => setStudentData({ ...studentData, email: e.target.value })}
                                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Mobile Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    value={studentData.mobileNumber}
                                    onChange={e => setStudentData({ ...studentData, mobileNumber: e.target.value })}
                                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                                    placeholder="+91 0000000000"
                                />
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--warning)', marginBottom: '0.5rem', display: 'block' }}>Reset Password <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Leave empty to keep current)</span></label>
                            <input
                                type="text"
                                value={studentData.password}
                                onChange={e => setStudentData({ ...studentData, password: e.target.value })}
                                style={{ width: '100%', borderColor: 'var(--border)' }}
                                placeholder="New Password"
                            />
                        </div>
                        <button className="btn-primary" style={{ marginTop: '1rem' }}>
                            <Save size={18} /> Update Profile
                        </button>
                    </form>
                </section>

                {/* Exam History Section */}
                <section>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={20} color="var(--secondary)" /> Examination History
                    </h3>

                    {history.length === 0 ? (
                        <div className="glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <AlertCircle size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>No exam records found for this student.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.map((record, idx) => (
                                <div key={idx} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{record.examTitle}</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{record.sessionName}</p>

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Clock size={14} color="var(--text-muted)" />
                                                Submitted: {record.submitTime ? new Date(record.submitTime).toLocaleString() : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: record.status === 'submitted' ? (record.score >= 40 ? 'var(--success)' : 'var(--error)') : 'var(--warning)' }}>
                                            {record.status === 'submitted' ? `${record.score} Marks` : 'N/A'}
                                        </div>
                                        <span className={`badge ${record.status === 'submitted' ? (record.score >= 40 ? 'badge-success' : 'badge-error') : 'badge-warning'}`}>
                                            {record.status === 'submitted' ? (record.score >= 40 ? 'Passed' : 'Failed') : 'In Progress'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </motion.div>
    );
};

export default StudentDetails;
