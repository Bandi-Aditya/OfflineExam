import axios from 'axios';
import CryptoJS from 'crypto-js';

// Ensure API_URL always ends with /api
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Remove trailing slash if present
API_URL = API_URL.replace(/\/$/, '');
// Add /api if not present
if (!API_URL.endsWith('/api')) {
    API_URL = API_URL + '/api';
}

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'ABCDEF1234567890ABCDEF1234567890';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('student_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('student_token');
            localStorage.removeItem('student_user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);


export const authService = {
    login: async (studentId, password) => {
        const res = await api.post('/auth/login', { studentId, password });
        if (res.data.success) {
            localStorage.setItem('student_token', res.data.data.token);
            localStorage.setItem('student_user', JSON.stringify(res.data.data.user));
        }
        return res.data;
    },
    loginOTP: async (studentId, otp) => {
        const res = await api.post('/auth/login-otp', { studentId, otp });
        if (res.data.success) {
            localStorage.setItem('student_token', res.data.data.token);
            localStorage.setItem('student_user', JSON.stringify(res.data.data.user));
        }
        return res.data;
    },
    sendOTP: async (studentId) => {
        const res = await api.post('/auth/send-otp', { studentId });
        return res.data;
    },
    forgotPassword: async (email) => {
        const res = await api.post('/auth/forgot-password', { email });
        return res.data;
    },
    logout: () => {
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_user');
    }
};

export const examService = {
    getAssignedExams: async () => {
        const res = await api.get('/student/exams/assigned');
        return res.data;
    },
    downloadExam: async (sessionId) => {
        const res = await api.get(`/student/exams/${sessionId}/download`);
        return res.data;
    },
    startExam: async (sessionId, sessionToken) => {
        const res = await api.post(`/student/exams/${sessionId}/start`, { sessionToken });
        return res.data;
    },
    submitExam: async (sessionId, data) => {
        const res = await api.post(`/student/exams/${sessionId}/submit`, data);
        return res.data;
    },
    getResult: async (sessionId) => {
        const res = await api.get(`/student/exams/${sessionId}/result`);
        return res.data;
    }
};

export const profileService = {
    getProfile: async () => {
        const res = await api.get('/student/profile');
        return res.data;
    },
    updateProfile: async (profileData) => {
        const res = await api.put('/student/profile', profileData);
        return res.data;
    }
};

export const practiceService = {
    getTopics: async () => {
        const res = await api.get('/student/practice/topics');
        return res.data;
    },
    generateExam: async (config) => {
        const res = await api.post('/student/practice/generate', config);
        return res.data;
    },
    submitResult: async (payload) => {
        const res = await api.post('/student/practice/submit', payload);
        return res.data;
    }
};


export const cryptoUtils = {
    decryptExam: (encryptedData) => {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedString);
    }
};

export default api;
