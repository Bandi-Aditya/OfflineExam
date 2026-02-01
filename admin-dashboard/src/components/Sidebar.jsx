import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Clock, Activity, Database } from 'lucide-react';
import { authService } from '../services/api';

const Sidebar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        { icon: <FileText size={20} />, label: 'Exams', path: '/exams' },
        { icon: <Clock size={20} />, label: 'Sessions', path: '/sessions' },
        { icon: <Activity size={20} />, label: 'Live Monitoring', path: '/monitoring' },
        { icon: <Users size={20} />, label: 'Students', path: '/students' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ];


    return (
        <aside style={{
            width: '280px',
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1.5rem'
        }}>
            <div style={{ marginBottom: '3rem', padding: '0 0.5rem' }}>
                <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
                    ExamShield Admin
                </h2>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.875rem 1rem',
                            borderRadius: '10px',
                            color: isActive ? 'white' : 'var(--text-muted)',
                            background: isActive ? 'var(--primary)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            fontWeight: isActive ? '600' : '400'
                        })}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{
                marginTop: 'auto',
                padding: '1.5rem',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {user.name?.charAt(0) || 'A'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user.name || 'Admin'}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Administrator</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--error)',
                        padding: '0.5rem',
                        fontSize: '0.9rem',
                        width: '100%'
                    }}
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
