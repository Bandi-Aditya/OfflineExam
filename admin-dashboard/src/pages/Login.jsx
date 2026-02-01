import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Shield, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await authService.login(studentId, password);
            if (res.success && res.data.user.role === 'admin') {
                navigate('/dashboard');
            } else {
                setError('Unauthorized: Admin access only.');
                authService.logout();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'radial-gradient(circle at top right, #1e293b, #0f172a)'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: '3rem',
                    textAlign: 'center'
                }}
            >


                <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Portal</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Secure Offline Examination System</p>

                {error && (
                    <div style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        color: 'var(--error)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Admin ID"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                            required
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
