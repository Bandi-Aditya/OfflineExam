import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor for adding the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: async (studentId, password) => {
        const response = await api.post('/auth/login', { studentId, password });
        if (response.data.success) {
            localStorage.setItem('admin_token', response.data.data.token);
            localStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    },
    verify: async () => {
        const response = await api.get('/auth/verify');
        return response.data;
    }
};

export const examService = {
    createExam: async (examData) => {
        const response = await api.post('/admin/exams', examData);
        return response.data;
    },
    generateExam: async (examData) => {
        const response = await api.post('/admin/exams/auto-generate', examData);
        return response.data;
    },
    getExams: async () => {
        const response = await api.get('/admin/exams');
        return response.data;
    },
    getExamById: async (id) => {
        const response = await api.get(`/admin/exams/${id}`);
        return response.data;
    },
    updateExam: async (id, examData) => {
        const response = await api.put(`/admin/exams/${id}`, examData);
        return response.data;
    },
    deleteExam: async (id) => {
        const response = await api.delete(`/admin/exams/${id}`);
        return response.data;
    },
    addQuestion: async (examId, questionData) => {
        const response = await api.post(`/admin/exams/${examId}/questions`, questionData);
        return response.data;
    },
    updateQuestion: async (id, questionData) => {
        const response = await api.put(`/admin/questions/${id}`, questionData);
        return response.data;
    },
    deleteQuestion: async (id) => {
        const response = await api.delete(`/admin/questions/${id}`);
        return response.data;
    },
    uploadExam: async (file, metadata) => {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata) {
            Object.keys(metadata).forEach(key => formData.append(key, metadata[key]));
        }
        const response = await api.post('/admin/exams/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const sessionService = {
    createSession: async (sessionData) => {
        const response = await api.post('/admin/sessions', sessionData);
        return response.data;
    },
    getSessions: async () => {
        const response = await api.get('/admin/sessions');
        return response.data;
    },
    getSessionById: async (id) => {
        const response = await api.get(`/admin/sessions/${id}`);
        return response.data;
    },
    updateSession: async (id, sessionData) => {
        const response = await api.put(`/admin/sessions/${id}`, sessionData);
        return response.data;
    },
    getLiveStatus: async (id) => {
        const response = await api.get(`/admin/sessions/${id}/live-status`);
        return response.data;
    },
    toggleSession: async (id, isActive) => {
        const response = await api.put(`/admin/sessions/${id}/toggle`, { isActive });
        return response.data;
    },
    getAllStudents: async () => {
        const response = await api.get('/admin/students');
        return response.data;
    },
    registerStudent: async (studentData) => {
        const response = await api.post('/admin/students', studentData);
        return response.data;
    },
    updateStudent: async (id, studentData) => {
        const response = await api.put(`/admin/students/${id}`, studentData);
        return response.data;
    },
    getStudentHistory: async (id) => {
        const response = await api.get(`/admin/students/${id}/history`);
        return response.data;
    },
    deleteSession: async (id) => {
        const response = await api.delete(`/admin/sessions/${id}`);
        return response.data;
    },
    deleteStudent: async (id) => {
        const response = await api.delete(`/admin/students/${id}`);
        return response.data;
    }
};


export const importService = {
    bulkImportStudents: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/admin/import/students', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    bulkImportQuestions: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/admin/import/questions', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export const questionBankService = {
    getAllQuestions: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await api.get(`/admin/question-bank?${params}`);
        return response.data;
    },
    deleteQuestion: async (id) => {
        const response = await api.delete(`/admin/question-bank/${id}`);
        return response.data;
    }
};

export default api;
