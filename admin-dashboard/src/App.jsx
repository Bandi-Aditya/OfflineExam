import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import QuestionBank from './pages/QuestionBank';
import Sessions from './pages/Sessions';
import Students from './pages/Students';
import StudentDetails from './pages/StudentDetails';
import Monitoring from './pages/Monitoring';
import Sidebar from './components/Sidebar';
import './index.css';

// Protected Route component
const ProtectedRoute = () => {
    const isAuthenticated = localStorage.getItem('admin_token') !== null;

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="layout-container">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/exams" element={<Exams />} />
                    <Route path="/question-bank" element={<QuestionBank />} />
                    <Route path="/sessions" element={<Sessions />} />
                    <Route path="/students" element={<Students />} />
                    <Route path="/students/:id" element={<StudentDetails />} />
                    <Route path="/monitoring" element={<Monitoring />} />
                    <Route path="/settings" element={<div>Settings Page (Coming Soon)</div>} />
                </Route>


                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
