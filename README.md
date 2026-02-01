# 🎓 Secure Offline Examination System

Welcome to the Secure Offline Examination System! This system is designed for college computer labs to ensure secure, uninterrupted exams even with unstable network conditions.

## 🚀 Getting Started

### 📋 Prerequisites
- **Node.js**: v18 or higher
- **PostgreSQL**: Installed and running
- **Git** (optional)

### 🛠️ One-Time Setup

1. **Database Setup**
   - Create a database named `offline_exam_db` in PostgreSQL.
   - Update `backend/.env` with your PostgreSQL `DB_PASSWORD`.

2. **Install Dependencies**
   Run the following command from the root folder:
   ```bash
   npm run install:all
   ```
   *Note: This might take a few minutes as it installs dependencies for Backend, Admin Dashboard, and Student App.*

3. **Initialize Database Schema**
   ```bash
   npm run db:init
   ```
   This will create tables and seed default accounts:
   - **Admin**: ID `ADMIN001`, Pass `admin123`
   - **Student**: ID `STU001`, Pass `student123`

### 🏃 Running the Application

To start all services together (Backend, Admin, Student):
```bash
npm run dev
```

The services will be available at:
- **Admin Dashboard**: http://localhost:5174
- **Student App**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🧪 Testing the Offline Flow

1. **Login** as a student at `localhost:5173`.
2. **Download** an assigned exam (Requires Internet).
3. **Start** the exam.
4. **Disconnect Internet** (optional - system will detect it).
5. **Answer Questions**: Notice the "Offline" status bar. Your answers are auto-saved to IndexedDB every few seconds!
6. **Reconnect** and **Submit**: Once you're back online, hit Submit to upload results.

## 📁 Project Structure
- `backend/`: Node.js Express server with PostgreSQL
- `admin-dashboard/`: React + Vite application for exam/session control
- `student-app/`: React + Vite + IndexedDB application for taking exams
- `docs/`: System documentation (Architecture, Schema, Manuals)

## 🔐 Security Features
- **AES-256 Encryption**: Exam data is encrypted during download and storage.
- **IndexedDB**: Local offline storage for persistent progress.
- **Auto-Submission**: If time runs out, answers are automatically logged.
- **Lockdown UI**: Detects tab switching and prevents right-click (basic protection).

---
Developed with ❤️ for Academic Integrity.
