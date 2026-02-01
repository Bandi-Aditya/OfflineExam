import { openDB } from 'idb';

const DB_NAME = 'ExamShield_Offline_DB';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Store for encrypted exam data
            if (!db.objectStoreNames.contains('exams')) {
                db.createObjectStore('exams', { keyPath: 'sessionId' });
            }
            // Store for student answers (auto-save)
            if (!db.objectStoreNames.contains('answers')) {
                db.createObjectStore('answers', { keyPath: 'id' }); // id: sessionId_questionId
            }
            // Store for session metadata
            if (!db.objectStoreNames.contains('session')) {
                db.createObjectStore('session', { keyPath: 'key' });
            }
        },
    });
};

export const offlineDB = {
    saveExam: async (sessionId, examData) => {
        const db = await initDB();
        await db.put('exams', { sessionId, ...examData });
    },
    getExam: async (sessionId) => {
        const db = await initDB();
        return db.get('exams', sessionId);
    },
    saveAnswer: async (assignmentId, questionId, answerText) => {
        const db = await initDB();
        await db.put('answers', {
            id: `${assignmentId}_${questionId}`,
            assignmentId,
            questionId,
            answerText,
            timestamp: new Date().toISOString()
        });
    },
    getAllAnswers: async (assignmentId) => {
        const db = await initDB();
        const allAnswers = await db.getAll('answers');
        return allAnswers.filter(a => a.assignmentId === assignmentId);
    },
    clearAnswers: async (assignmentId) => {
        const db = await initDB();
        const tx = db.transaction('answers', 'readwrite');
        const store = tx.objectStore('answers');
        const all = await store.getAll();
        for (const item of all) {
            if (item.assignmentId === assignmentId) {
                await store.delete(item.id);
            }
        }
    },
    setSessionStatus: async (assignmentId, status) => {
        const db = await initDB();
        await db.put('session', { key: 'status', assignmentId, status });
    },
    getSessionStatus: async () => {
        const db = await initDB();
        return db.get('session', 'status');
    }
};
