# Backend Server - Secure Offline Examination System

## 📋 Prerequisites

Before running the backend server, ensure you have:

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)

## 🔧 Setup Instructions

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for the `postgres` user

**Alternative: Use PostgreSQL in Docker**
```bash
docker run --name exam-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 2. Create Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE offline_exam_db;
```

Or using command line:
```bash
# Windows (in Command Prompt)
psql -U postgres -c "CREATE DATABASE offline_exam_db;"
```

### 3. Configure Environment Variables

The `.env` file has been created with default values. If your PostgreSQL configuration is different, update:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=offline_exam_db
DB_USER=postgres
DB_PASSWORD=your_password_here  # Change this to your PostgreSQL password
```

### 4. Install Dependencies

Dependencies have already been installed. If you need to reinstall:

```bash
npm install
```

### 5. Initialize Database

Run the database setup script to create tables and seed initial data:

```bash
npm run init-db
```

This will create:
- All necessary tables (users, exams, questions, sessions, etc.)
- An admin user (ID: ADMIN001, Password: admin123)
- 5 sample students (IDs: STU001-STU005, Password: student123)

### 6. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📍 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token  
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Register new user (admin only)

### Admin - Exams
- `POST /api/admin/exams` - Create exam
- `GET /api/admin/exams` - Get all exams
- `GET /api/admin/exams/:id` - Get exam by ID
- `PUT /api/admin/exams/:id` - Update exam
- `DELETE /api/admin/exams/:id` - Delete exam

### Admin - Questions
- `POST /api/admin/exams/:examId/questions` - Add question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question

### Admin - Sessions
- `POST /api/admin/sessions` - Create exam session
- `GET /api/admin/sessions` - Get all sessions
- `GET /api/admin/sessions/:id` - Get session details
- `PUT /api/admin/sessions/:id/toggle` - Activate/deactivate session
- `GET /api/admin/sessions/:id/live-status` - Get live monitoring data
- `GET /api/admin/sessions/:id/results` - Get session results
- `GET /api/admin/results/export/:sessionId` - Export results as CSV
- `GET /api/admin/students` - Get all students

### Student
- `GET /api/student/exams/assigned` - Get assigned exams
- `GET /api/student/exams/:sessionId/download` - Download exam (encrypted)
- `POST /api/student/exams/:sessionId/start` - Start exam
- `POST /api/student/exams/:sessionId/submit` - Submit exam answers
- `GET /api/student/exams/:sessionId/result` - Get exam result

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing the API

You can test the API using:
- Postman
- Thunder Client (VS Code extension)
- cURL

Example login request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"ADMIN001","password":"admin123"}'
```

## 📊 Database Schema

The database includes the following tables:
- `users` - Store user information (admin and students)
- `exams` - Exam definitions
- `questions` - Questions for each exam
- `exam_sessions` - Active exam sessions
- `exam_assignments` - Student assignments to sessions
- `student_answers` - Student responses
- `exam_logs` - Audit logs

## 🛠️ Troubleshooting

### Database Connection Error

If you see "database does not exist" error:
```bash
psql -U postgres -c "CREATE DATABASE offline_exam_db;"
```

If you see "password authentication failed":
- Check your `.env` file has the correct `DB_PASSWORD`
- Ensure PostgreSQL service is running

### Port Already in Use

If port 5000 is busy, change the `PORT` in `.env`:
```env
PORT=5001
```

### Module Not Found Errors

Reinstall dependencies:
```bash
npm install
```

## 📝 Default Credentials

After running `npm run init-db`, you can login with:

**Admin:**
- Student ID: `ADMIN001`
- Password: `admin123`

**Students:**
- Student IDs: `STU001`, `STU002`, `STU003`, `STU004`, `STU005`
- Password: `student123`

## 🚀 Next Steps

After starting the backend server:
1. Set up the Admin Dashboard frontend
2. Set up the Student App frontend
3. Test the complete flow

## 📧 Support

For issues or questions, refer to the main project documentation.
