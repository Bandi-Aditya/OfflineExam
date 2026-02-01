import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Portal from './pages/Portal';
import ExamInterface from './pages/ExamInterface';
import Results from './pages/Results';
import Profile from './pages/Profile';
import SelfPractice from './pages/SelfPractice';
import './index.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('student_token') !== null;
    if (!isAuthenticated) return <Navigate to="/" replace />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />

                <Route path="/portal" element={
                    <ProtectedRoute>
                        <Portal />
                    </ProtectedRoute>
                } />

                <Route path="/exam/:sessionId" element={
                    <ProtectedRoute>
                        <ExamInterface />
                    </ProtectedRoute>
                } />

                <Route path="/result/:sessionId" element={
                    <ProtectedRoute>
                        <Results />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />

                <Route path="/practice" element={
                    <ProtectedRoute>
                        <SelfPractice />
                    </ProtectedRoute>
                } />


                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
