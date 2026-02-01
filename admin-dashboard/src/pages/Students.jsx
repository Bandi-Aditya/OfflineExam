import React, { useState, useEffect } from 'react';
import { sessionService, importService } from '../services/api';
import { User, Mail, Shield, UserPlus, Search, MoreHorizontal, Filter, X, Lock, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Delete states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [deleteStep, setDeleteStep] = useState(1); // 1 = Confirm, 2 = Final Warning

    const [newStudent, setNewStudent] = useState({
        studentId: '',
        name: '',
        email: '',
        password: 'student123' // Default password
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await sessionService.getAllStudents();
            setStudents(res.data.students || []);
        } catch (err) {
            console.error('Error fetching students', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await sessionService.registerStudent(newStudent);
            if (res.success) {
                setShowModal(false);
                fetchStudents();
                setNewStudent({ studentId: '', name: '', email: '', password: 'student123' });
                alert('Student registered successfully!');
            }
        } catch (err) {
            console.error('Registration error:', err);
            alert(err.response?.data?.message || 'Failed to register student');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const res = await importService.bulkImportStudents(file);
            alert(res.message);
            fetchStudents();
        } catch (err) {
            console.error('Import error:', err);
            alert('Failed to import students');
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const confirmDelete = (student) => {
        setStudentToDelete(student);
        setDeleteStep(1);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!studentToDelete) return;
        try {
            await sessionService.deleteStudent(studentToDelete.id);
            setStudents(students.filter(s => s.id !== studentToDelete.id));
            setShowDeleteModal(false);
            setStudentToDelete(null);
            alert('Student deleted successfully');
        } catch (err) {
            console.error('Delete error', err);
            alert('Failed to delete student');
        }
    };

    return (
        <div className="animate-fade">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Student Core</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Centralized management of candidates and session authorization.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={20} /> Import CSV
                        <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                    </label>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <UserPlus size={20} /> Register Candidate
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        style={{ width: '100%', paddingLeft: '3rem' }}
                        placeholder="Filter by name, ID or authorization code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-secondary">
                    <Filter size={18} />
                </button>
            </div>

            <div className="glass" style={{ overflow: 'hidden' }}>
                <table style={{ margin: 0 }}>
                    <thead>
                        <tr>
                            <th>Identity</th>
                            <th>Student ID</th>
                            <th>Communication</th>
                            <th>Access Level</th>
                            <th>Session Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Synchronizing repository...</td></tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No candidates found in this segment.</td></tr>
                        ) : filteredStudents.map(student => (
                            <motion.tr
                                key={student.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '800' }}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600' }}>{student.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Entity</p>
                                        </div>
                                    </div>
                                </td>
                                <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{student.student_id}</code></td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <Mail size={14} /> {student.email}
                                    </div>
                                </td>
                                <td>
                                    <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Shield size={12} /> Candidate
                                    </span>
                                </td>
                                <td>
                                    <span className="badge badge-success">Fully Authorized</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <Link to={`/students/${student.id}`} style={{ textDecoration: 'none' }}>
                                        <button className="btn-secondary" style={{ padding: '0.5rem' }}>
                                            <MoreHorizontal size={18} /> Details
                                        </button>
                                    </Link>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '0.5rem', marginLeft: '0.5rem', color: 'var(--error)', borderColor: 'rgba(255,0,0,0.2)' }}
                                        onClick={() => confirmDelete(student)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {/* Registration Modal */}
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}
                    >
                        {/* ... Existing registration modal content ... */}
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.75rem' }}>Register New Candidate</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* ... fields ... */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Student ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. STU101"
                                        value={newStudent.studentId}
                                        onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter student name"
                                        value={newStudent.name}
                                        onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="student@university.com"
                                        value={newStudent.email}
                                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Initial Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            style={{ width: '100%', paddingLeft: '3rem' }}
                                            value={newStudent.password}
                                            onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                                    Authorize Access
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Delete Confirmation Modal (2 Steps) */}
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}
                    >
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass" style={{ width: '100%', maxWidth: '450px', padding: '2rem', border: '1px solid var(--error)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ width: '60px', height: '60px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <AlertTriangle size={32} color="var(--error)" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                    {deleteStep === 1 ? 'Remove Student?' : 'Final Warning'}
                                </h3>
                                <p style={{ color: 'var(--text-muted)' }}>
                                    {deleteStep === 1
                                        ? `Are you sure you want to remove ${studentToDelete?.name}? This action cannot be undone.`
                                        : `This will permanently delete ${studentToDelete?.name}'s account and ALL exam history. Confirm deletion?`
                                    }
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {deleteStep === 1 ? (
                                    <>
                                        <button
                                            className="btn-primary"
                                            style={{ background: 'var(--error)', border: 'none' }}
                                            onClick={() => setDeleteStep(2)}
                                        >
                                            Continue Removal
                                        </button>
                                        <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn-primary"
                                            style={{ background: 'var(--error)', border: 'none' }}
                                            onClick={handleDelete}
                                        >
                                            Permanently Delete
                                        </button>
                                        <button className="btn-secondary" onClick={() => setDeleteStep(1)}>Go Back</button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentManagement;
