import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { BookOpen, Key, Hash, Smartphone, Mail, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [step, setStep] = useState(1); // 1: ID input (or Email for forgot), 2: Password/OTP input
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [forgotMode, setForgotMode] = useState(false);
    const [email, setEmail] = useState('');

    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');
        setLoading(true);
        try {
            await authService.sendOTP(studentId);
            setStep(2);
            setMsg('OTP sent to your registered mobile/email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Check Student ID.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let res;
            if (loginMethod === 'password') {
                res = await authService.login(studentId, password);
            } else {
                res = await authService.loginOTP(studentId, otp);
            }

            if (res.success) {
                navigate('/portal');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgot = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');
        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setMsg(`Password reset link sent to ${email}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass"
                style={{ width: '100%', maxWidth: '480px', padding: '3.5rem', textAlign: 'center' }}>

                <div style={{ width: '72px', height: '72px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <BookOpen size={36} color="#8b5cf6" />
                </div>

                <h1 style={{ fontSize: '2.25rem', marginBottom: '0.75rem', fontWeight: '800' }}>Student Portal</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    {forgotMode ? 'Reset your password' : 'Secure Assessment Gateway'}
                </p>

                {error && <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--error)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(244, 63, 94, 0.2)' }}>{error}</div>}
                {msg && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{msg}</div>}

                {forgotMode ? (
                    <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.5rem', display: 'block' }}>Registered Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="email" placeholder="student@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', paddingLeft: '3rem', height: '56px', fontSize: '1rem' }} required />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', height: '56px', fontSize: '1.125rem' }}>
                            {loading ? 'Processing...' : 'Send Reset Link'}
                        </button>
                        <button type="button" onClick={() => setForgotMode(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <ArrowLeft size={16} /> Back to Login
                        </button>
                    </form>
                ) : (
                    <>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', marginBottom: '2rem' }}>
                            <button onClick={() => { setLoginMethod('password'); setStep(1); }} style={{ flex: 1, padding: '10px', background: loginMethod === 'password' ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}>Password</button>
                            <button onClick={() => { setLoginMethod('otp'); setStep(1); }} style={{ flex: 1, padding: '10px', background: loginMethod === 'otp' ? 'var(--primary)' : 'transparent', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}>OTP Login</button>
                        </div>

                        <form onSubmit={loginMethod === 'otp' && step === 1 ? handleSendOTP : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {(step === 1 || loginMethod === 'password') && (
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.5rem', display: 'block' }}>Student ID</label>
                                    <div style={{ position: 'relative' }}>
                                        <Hash size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="text" placeholder="e.g. STU123" value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ width: '100%', paddingLeft: '3rem', height: '56px', fontSize: '1rem' }} required />
                                    </div>
                                </div>
                            )}

                            {loginMethod === 'password' && (
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.5rem', display: 'block' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Key size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', paddingLeft: '3rem', height: '56px', fontSize: '1rem' }} required />
                                    </div>
                                </div>
                            )}

                            {loginMethod === 'otp' && step === 2 && (
                                <div style={{ textAlign: 'left' }}>
                                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.5rem', marginBottom: '0.5rem', display: 'block' }}>Enter OTP</label>
                                    <div style={{ position: 'relative' }}>
                                        <Smartphone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input type="text" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', paddingLeft: '3rem', height: '56px', fontSize: '1rem', letterSpacing: '4px' }} required />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', height: '56px', fontSize: '1.125rem' }}>
                                {loading ? 'Processing...' : (loginMethod === 'otp' && step === 1 ? 'Get OTP' : 'Secure Login')}
                            </button>
                        </form>

                        {loginMethod === 'password' && (
                            <button onClick={() => setForgotMode(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
                                Forgot Credentials?
                            </button>
                        )}
                        {loginMethod === 'otp' && step === 2 && (
                            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', marginTop: '1.5rem', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
                                Resend OTP / Change ID
                            </button>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default Login;
