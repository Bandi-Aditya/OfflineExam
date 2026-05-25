# 🎓 Secure Offline Examination System — Complete Interview Guide

## Project Overview (1-line pitch)

> **"I built a full-stack, secure, offline-capable digital examination system that lets institutes conduct tamper-proof exams even without internet, with real-time admin monitoring, OTP-based login, AES-256 encryption, and automatic anti-cheating protection."**

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        THREE-TIER ARCHITECTURE                        │
├─────────────────┬────────────────────────┬───────────────────────────┤
│   FRONTEND 1    │      FRONTEND 2         │        BACKEND            │
│ Admin Dashboard │   Student Portal        │   Node.js + Express       │
│  (React + Vite) │   (React + Vite)        │        API Server         │
├─────────────────┴────────────────────────┴───────────────────────────┤
│                         DATABASE LAYER                                │
│                    MongoDB Atlas (Cloud)                              │
└──────────────────────────────────────────────────────────────────────┘
         Deployed on: Vercel (Frontend + Backend Serverless)
```

---

## Project Structure

| Part | Folder | Purpose |
|------|--------|---------|
| Admin Dashboard | `admin-dashboard/` | Admin manages exams, students, sessions |
| Student Portal | `portal-client/` | Students login, take exams, view results |
| Backend API | `backend/` | REST API, database, email, encryption |

---

## Complete Tech Stack

---

### 1. Node.js + Express.js (Backend Framework)

**Why used?**
- JavaScript on both frontend and backend — code consistency, one language everywhere
- Express is very lightweight and perfect for REST APIs
- Supports async/await natively — important for DB + email operations
- Works perfectly as Vercel Serverless Functions (exports `app` instead of calling `listen`)

**For what features?**
- All 6 route files: `authRoutes`, `adminRoutes`, `sessionRoutes`, `studentRoutes`, `importRoutes`, `questionBankRoutes`
- HTTP server entry: `src/server.js`
- Middleware pipeline: CORS, Rate Limiting, Auth middleware, Request Logging

---

### 2. MongoDB + Mongoose (Database)

**Why used over SQL?**
- Exam data is hierarchical — an exam has questions, each question has options, a session embeds student assignments with their answers
- MongoDB's document model fits this naturally in ONE document — no JOINs
- In MySQL you'd need 5+ tables and complex joins for every query
- Mongoose adds schema validation, types, and model methods on top of raw MongoDB

**For what features?**
- `User.js` — stores students and admins with roles
- `Exam.js` — exam with embedded questions array (MCQ + descriptive)
- `ExamSession.js` — exam session + assignments + student answers all in one document
- `QuestionBank.js` — reusable question library
- `comparePassword()` method defined directly on the User Mongoose model

---

### 3. JSON Web Token / jsonwebtoken (Authentication)

**Why used?**
- Stateless authentication — server stores NOTHING
- Works well with Vercel Serverless (each request can go to different instance — no shared session memory)
- Token carries user id, role, name — no DB lookup needed per request

**How it works in the code:**
```
Login → Server generates JWT → Client stores in localStorage
→ Client sends: Authorization: Bearer <token>
→ Server verifies with auth middleware → access granted
```

**For what features?**
- `authController.js` — `generateToken()` called on successful login
- `middleware/auth.js` — `authenticate()` middleware runs on every protected route
- `authorize('admin')` — Role-Based Access Control (RBAC), returns 403 for wrong role
- Token expiry: 24 hours (`JWT_EXPIRES_IN=24h`)

---

### 4. bcryptjs (Password Hashing)

**Why used?**
- Passwords are NEVER stored in plain text — only hashed versions stored
- bcrypt uses salting — random data added to password before hash, making rainbow tables useless
- 10 salt rounds = 2^10 iterations = ~100ms per hash — intentionally slow
- Makes brute force impractical even with a stolen database

**For what features?**
- `User.js` — `password_hash` field stores the bcrypt hash
- `authController.js` — `bcrypt.hash(password, 10)` when creating users
- `User.js` — `comparePassword()` method uses `bcrypt.compare()`
- `importController.js` — hashes default passwords during bulk Excel import

---

### 5. crypto-js — AES-256 Encryption

**Why used?**
- Exam questions must be encrypted before being sent to the student's browser
- If someone intercepts the API response or opens browser storage in dev tools — they see gibberish
- AES-256 (Advanced Encryption Standard, 256-bit key) is military-grade, symmetric encryption
- crypto-js works in both Node.js and browser environments

**For what features?**
- `utils/encryption.js` — `encrypt()` and `decrypt()` with AES-256
- Exam data is encrypted before being stored in student's IndexedDB
- `generateSessionToken()` — generates a random 32-byte session token using `CryptoJS.lib.WordArray.random(32)`
- `hash()` / `verifyHash()` — SHA-256 hashing for data integrity

---

### 6. Nodemailer (Email Service)

**Why used?**
- Need to send OTPs, welcome emails, exam schedule notifications
- nodemailer connects to Gmail SMTP server (port 465, SSL/TLS)
- Free email sending through Google's servers

**For what features (inside `utils/emailService.js`):**
1. `sendEmailOTP()` — sends formatted HTML OTP email for login
2. `sendWelcomeEmail()` — sends credentials when admin creates a student account
3. `sendExamScheduledEmail()` — notifies student when assigned to an exam session
4. `sendExamUpdateEmail()` — notifies when session time/venue changes
5. `notificationService.js` — background job, runs every 10 minutes on local server to send reminders

---

### 7. express-rate-limit (Rate Limiting / Security)

**Why used?**
- Prevents brute force login attacks (trying thousands of passwords)
- Prevents DDoS-style flooding of API endpoints
- Applied to all `/api/*` routes

**Configuration:**
- Window: 15 minutes
- Max: 100 requests per IP per window
- Returns HTTP 429 (Too Many Requests) when exceeded

---

### 8. xlsx (Excel File Processing)

**Why used?**
- Educational institutes maintain student rosters in Excel (.xlsx / .csv)
- Instead of manually entering 100+ students, admin uploads one Excel file
- Same for questions — import hundreds of questions from Excel

**For what features:**
- `importController.js` → `bulkImportStudents()` — reads Excel, creates User records in DB, sends welcome emails
- `importController.js` → `bulkImportQuestions()` — reads Excel, populates QuestionBank collection
- Reads in-memory from `req.file.buffer` (no disk write needed — serverless compatible)

---

### 9. multer (File Upload Middleware)

**Why used?**
- Express doesn't handle `multipart/form-data` natively
- multer processes file uploads from HTML forms
- `memoryStorage()` keeps file in RAM buffer — perfect for serverless (no disk access)

**For what features:**
- Receives `.xlsx` file uploads from admin dashboard
- Passes `req.file.buffer` to xlsx parser

---

### 10. React 18 (Frontend UI Framework)

**Why used?**
- Component-based architecture — reuse modal, cards, buttons across pages
- Hooks: `useState`, `useEffect`, `useCallback` — efficient state management
- Virtual DOM — efficient re-renders for the real-time countdown timer

**Admin Dashboard pages:**

| Page | Key Features |
|------|-------------|
| `Dashboard.jsx` | Stats overview, student/exam counts |
| `Exams.jsx` | Full CRUD for exams, add/remove questions |
| `Sessions.jsx` | Schedule sessions, start/stop live sessions, edit sessions |
| `Students.jsx` | Add individual students, bulk Excel import |
| `StudentDetails.jsx` | View individual student's score and answers |
| `Monitoring.jsx` | Real-time tracking of student exam progress |
| `QuestionBank.jsx` | Browse and manage question library |

**Student Portal pages:**

| Page | Key Features |
|------|-------------|
| `Login.jsx` | Both password login and OTP-based login |
| `Portal.jsx` | View all assigned upcoming exams |
| `ExamInterface.jsx` | Full exam UI — timer, question navigator, auto-save, anti-cheat |
| `Results.jsx` | View final score and answer review |
| `SelfPractice.jsx` | Practice mode without timer/grading |
| `Profile.jsx` | View and update student profile |

---

### 11. Vite (Build Tool)

**Why used instead of Create React App?**
- Vite is 10-100x faster than Webpack-based CRA during development
- Instant Hot Module Replacement (HMR) — page updates without full reload
- ES module-based dev server — no bundling in development
- Lean optimized production builds in `dist/` folder

---

### 12. React Router DOM v6 (Client-Side Routing)

**Why used?**
- Navigation between pages without full browser page reloads (SPA behavior)
- Protected routes — redirects to login if not authenticated
- URL params: `/exam/:sessionId` to read session ID from URL

**For what features:**
- `App.jsx` defines all route mappings
- `useNavigate()` for programmatic navigation (e.g., after exam submit → redirect to portal)
- `useParams()` in `ExamInterface.jsx` to extract `sessionId`

---

### 13. Framer Motion (Animations)

**Why used?**
- Makes UI feel professional and premium
- `AnimatePresence` handles exit animations (impossible to do with CSS alone in React)
- Declarative — just add props like `initial`, `animate`, `exit`

**For what features:**
- Question card slides left/right when navigating between questions
- Session modal scales in from center
- Offline warning banner animates height from 0 to auto when internet drops

---

### 14. Axios (HTTP Client)

**Why used over browser's native `fetch()`?**
- Automatic JSON parsing — no need to call `.json()`
- Request interceptors — automatically attach `Authorization: Bearer <token>` to every request
- Better error handling with HTTP status codes
- Centralized API service in `services/api.js`

---

### 15. idb — IndexedDB Wrapper (Offline Storage)

**Why used?**
- The project supports TRUE OFFLINE mode during exams
- After downloading, exam runs entirely from local storage
- IndexedDB can store large structured data (unlike localStorage's 5MB limit)
- `idb` is a tiny Promise-based wrapper around the complex raw IndexedDB API

**For what features (`portal-client/src/db/offline.js`):**
- `exams` object store — stores AES-256 encrypted exam data by `sessionId`
- `answers` object store — auto-saves every answer selection to IndexedDB immediately
- `session` object store — stores current session status
- If internet goes down mid-exam — zero data loss, all answers preserved locally

---

### 16. Lucide React (Icon Library)

**Why used?**
- Lightweight, tree-shaken (only imported icons are bundled)
- Clean, consistent SVG icons as React components
- Used extensively: `Clock`, `Play`, `Pause`, `Monitor`, `Users`, `Send`, `AlertTriangle`, `CheckCircle`, `Trash2`, `Edit2`, `Plus`, `X`

---

### 17. date-fns (Date Utilities)

**Why used?**
- Formatting exam start/end times in admin dashboard
- Parsing and displaying dates in human-readable format
- Smaller footprint than Moment.js

---

### 18. Vercel (Deployment Platform)

**Why used?**
- Free tier, zero-config deployment for Vite React SPAs
- Supports Node.js/Express as Serverless Functions via `api/` folder convention
- Global CDN for fast content delivery
- Environment variables managed through Vercel dashboard (no .env committed)

**How Express runs on Vercel:**
- `vercel.json` routes all requests to `api/index.js` which exports the Express app
- Code checks `process.env.VERCEL === '1'` → skips `app.listen()` (Vercel handles HTTP)
- Frontend `vercel.json` rewrites all routes to `index.html` for SPA support

---

### 19. dotenv (Environment Variables)

**Why used?**
- Keeps all secrets (JWT secret, MongoDB URI, Gmail password, encryption key) out of code
- Different values for development (.env file) vs production (Vercel dashboard)

**Key variables:**
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — JWT signing key
- `ENCRYPTION_KEY` — AES-256 key for exam encryption
- `EMAIL_USER` + `EMAIL_APP_PASSWORD` — Gmail SMTP credentials
- `RATE_LIMIT_WINDOW_MS` + `RATE_LIMIT_MAX_REQUESTS`

---

### 20. nodemon (Development Tool)

**Why used?**
- Automatically restarts Node.js server when files change during development
- Only in `devDependencies` — not used in production

---

## Security Features Implemented

| Feature | Technology | Implementation |
|---------|-----------|---------------|
| Password Hashing | bcryptjs | 10 salt rounds, stored as hash, never plain text |
| JWT Authentication | jsonwebtoken | Bearer token, 24h expiry, signed with secret |
| Role-Based Access | Custom Middleware | `authorize('admin')` / `authorize('student')` |
| Exam Encryption | crypto-js AES-256 | Questions encrypted before sent to browser |
| Rate Limiting | express-rate-limit | 100 req/15 min per IP, HTTP 429 on exceed |
| OTP Login | crypto + nodemailer | 6-digit, 5-min expiry, stored server-side |
| Tab Switch Detection | Browser visibilitychange API | 3 switches → auto submit exam with flag |
| Fullscreen Mode | Browser Fullscreen API | Requested on first user interaction |
| Right-Click Disabled | DOM contextmenu event | `e.preventDefault()` on contextmenu |
| No Cache Headers | HTTP response headers | `Cache-Control: no-store` on all API responses |
| CORS Protection | Manual middleware | Echoes requesting origin, handles preflight OPTIONS |

---

## Data Flow — Student Exam End-to-End

```
Student Login (password or OTP)
    → JWT issued
    → View Assigned Exams (from ExamSession model)
    → Download Exam
        → Server AES-256 encrypts questions
        → Student stores in IndexedDB (browser)
    → Take Exam
        → Reads from IndexedDB (works offline)
        → Every answer selection → auto-saved to IndexedDB
        → Tab switch detected → warning / auto-submit at 3 strikes
        → Timer countdown (auto-submit at 0)
    → Submit
        → IndexedDB answers → POST /api/student/exams/:sessionId/submit
        → Server grades MCQs automatically
        → Score + answers stored in ExamSession.assignments
    → View Result
        → GET /api/student/exams/:sessionId/result
```

## Data Flow — Admin Session Management

```
Admin creates Exam (title, duration, passing marks, questions)
    → Creates ExamSession (links exam + assigns students + sets time window)
    → Starts Session (is_active = true)
        → Assigned students can now see and download the exam
    → Monitors from Monitoring page (student status, submission count)
    → Ends Session (is_active = false)
    → Reviews individual student results from StudentDetails page
```

---

## Backend Architecture Pattern

```
server.js (Entry Point)
    ↓
Middleware Pipeline
    → Manual CORS Handler (custom, echoes origin)
    → JSON Parser (10MB limit)
    → Request Logger
    → Rate Limiter (express-rate-limit)
    ↓
Routes (6 route files)
    → /api/auth  → authRoutes.js
    → /api/admin → adminRoutes.js + sessionRoutes.js
    → /api/student → studentRoutes.js
    → /api/admin/import → importRoutes.js
    → /api/admin/question-bank → questionBankRoutes.js
    ↓
Controllers (business logic)
    → authController  → login, OTP, register, token verify
    → examController  → CRUD for exams + questions
    → sessionController → CRUD for sessions + toggle active
    → studentController → download exam, submit, results
    → importController → Excel parsing + bulk create
    → questionBankController → question library
    ↓
Mongoose Models → MongoDB Atlas
    → User, Exam, ExamSession, QuestionBank

utils/ (cross-cutting concerns)
    → emailService.js  → nodemailer Gmail SMTP
    → encryption.js    → AES-256, SHA-256
    → notificationService.js → background reminder job
```

---

## Expected Interview Cross-Questions

### Q1: Why MongoDB over MySQL for this project?

Exam data is hierarchical — an exam has questions, each question has options, and an exam session embeds student assignments with their answers. MongoDB fits this naturally in one document. In MySQL, I'd need at minimum 5 tables: `exams`, `questions`, `options`, `sessions`, `student_assignments` — and every query would require multiple JOINs. MongoDB avoids joins and is faster for this nested read pattern. The flexible schema also allows MCQ and descriptive questions to coexist without nullable columns.

---

### Q2: What is JWT and why is it stateless? Why not use sessions?

JWT (JSON Web Token) is a compact, URL-safe token that encodes user information (id, role, name) and is digitally signed with a secret. "Stateless" means the server stores absolutely nothing — all info is inside the token itself. When the client sends the JWT, the server just verifies the signature and reads the payload.

I chose JWT over traditional sessions because the backend is deployed on Vercel as Serverless Functions. Each request can land on a different isolated instance. Session-based auth would require shared storage (like Redis) between instances. JWT works everywhere without any shared infrastructure.

---

### Q3: How does the offline functionality work technically?

1. When a student opens their assigned exam, `examService.downloadExam(sessionId)` calls the API
2. The server AES-256 encrypts the exam questions and returns the encrypted payload
3. The encrypted data is stored in the browser's IndexedDB using the `idb` library (`offlineDB.saveExam()`)
4. During the exam, every time the student selects an answer, `offlineDB.saveAnswer()` is called immediately — answer is saved to IndexedDB before any API call
5. On submit, `navigator.onLine` is checked. If online → `examService.submitExam()`. If offline → alert the student to keep the tab open
6. The exam runs entirely from IndexedDB after download, so internet drops have zero impact on the exam experience

---

### Q4: Why AES-256? Explain how it works here.

AES-256 is a symmetric encryption algorithm — the same 256-bit key is used to both encrypt and decrypt. I used it to encrypt exam question data before storing it in the student's browser. Even if someone opens Chrome DevTools → Application → IndexedDB, they see an encrypted ciphertext string, not the actual questions.

The encryption key (`ENCRYPTION_KEY`) lives only in the backend's environment variables and is used server-side during the download step. The frontend receives already-encrypted data and stores it as-is. Only the backend knows how to decrypt it for grading — the student portal never decrypts the full questions from IndexedDB directly; it just displays them as received from the server after the secure download.

---

### Q5: What is bcrypt salt and why 10 rounds?

A salt is a random string automatically generated by bcrypt and prepended to the password before hashing. This ensures that even two users with the password "abc123" will have completely different hashes. This defeats precomputed "rainbow table" attacks where an attacker has a lookup table of common passwords and their hashes.

10 rounds means the hashing algorithm runs 2^10 = 1024 iterations. At this setting, each hash takes about 100ms. So an attacker with a leaked database can only test ~10 passwords/second — making brute force computationally impractical for strong passwords.

---

### Q6: How does the tab-switching anti-cheat detection work?

The browser provides a `visibilitychange` event on `document`. When a student switches to another tab or minimizes the window, `document.hidden` becomes `true`. In `ExamInterface.jsx`, I listen to this event inside a `useEffect`. When caught:
- 1st violation: Shows alert "Tab 1/3, exam auto-submits on 3rd"
- 2nd violation: Shows alert "Tab 2/3"
- 3rd violation: `autoSubmit()` is called — submits exam with `autoSubmitted: true` flag stored in MongoDB

The admin can see this flag in the monitoring dashboard.

---

### Q7: How did you deploy an Express.js backend on Vercel (which is mainly for static sites)?

Vercel supports Node.js Serverless Functions through its `api/` folder convention. I placed an `api/index.js` file in the backend which imports and exports the Express app:

```js
// api/index.js
import app from '../src/server.js';
export default app;
```

The `vercel.json` routes all incoming requests to this file. Vercel wraps it as a Lambda function.

In `server.js`, I check `process.env.VERCEL === '1'` before calling `app.listen()` — in Vercel's environment, `listen()` is skipped because Vercel handles the HTTP layer. The Express app is just used for its routing and middleware functionality.

---

### Q8: Explain the OTP login flow.

1. Student enters Student ID → clicks "Send OTP"
2. Backend: `POST /api/auth/send-otp` → finds student in DB by `student_id`
3. Generates 6-digit OTP: `Math.floor(100000 + Math.random() * 900000).toString()`
4. Stores in server-side `Map`: `otpStore.set(studentId, { otp, expiry: Date.now() + 5*60*1000 })`
5. Sends OTP to student's registered email via nodemailer → Gmail SMTP
6. Student enters OTP → `POST /api/auth/login-otp`
7. Backend checks: does `otpStore.get(studentId).otp === receivedOTP` AND `Date.now() < expiry`?
8. If yes → deletes OTP from Map (one-time use) → generates JWT → returns to client

**Note:** In production at scale, I'd replace the in-memory Map with Redis, because in-memory state is lost when the serverless function cold-starts.

---

### Q9: What is the difference between `authenticate` and `authorize` middleware?

`authenticate` middleware verifies WHO the user is. It:
1. Reads the `Authorization: Bearer <token>` header
2. Calls `jwt.verify(token, JWT_SECRET)` to decode and validate
3. Attaches `req.user = decoded` (with id, role, name) to the request

`authorize(...roles)` middleware verifies WHAT the user can do. It:
1. Assumes `authenticate` already ran (so `req.user` exists)
2. Checks if `req.user.role` is in the allowed roles array
3. Returns HTTP 403 Forbidden if role doesn't match

Example: `GET /api/admin/students` requires both `authenticate` (is logged in?) AND `authorize('admin')` (is an admin?). A student's JWT would pass authentication but fail authorization.

---

### Q10: Why are there two separate React apps instead of one?

Admin and student have completely different:
- **Access levels** — admins must NEVER see student internals mixed with admin controls
- **UI/UX** — admin needs data tables, session controls, monitoring; student needs a focused exam interface
- **Security** — in a single app, the admin component code ships to students too (even if hidden by routing)

Separate Vercel deployments mean:
- Completely isolated codebases and deployments
- A bug or deploy issue in one doesn't affect the other
- Students get a different URL entirely — no admin code is ever in their browser bundle

---

### Q11: What improvements would you make with more time?

1. **Redis** for OTP storage — works correctly across multiple serverless instances (in-memory Map is lost on cold start)
2. **Socket.io real-time monitoring** — already imported in server.js but not fully wired; would enable live dashboard updates without polling
3. **Service Worker + Background Sync** — for truly automatic offline submission when internet restores
4. **AI-based descriptive answer evaluation** — NLP/LLM API to grade written answers
5. **Screenshot prevention** — Canvas-based question rendering makes text harder to copy/screenshot
6. **Facial recognition proctoring** — using WebRTC + face-api.js for identity verification

---

## Quick Summary Card

| Concept | Tool | Why Chosen |
|---------|------|-----------|
| Backend Framework | Express.js | Lightweight REST API, serverless-compatible |
| Database | MongoDB + Mongoose | Flexible nested documents, no JOINs |
| Authentication | JWT | Stateless, works with serverless |
| Password Security | bcryptjs | Salt+hash, intentionally slow, brute-force resistant |
| Data Encryption | crypto-js AES-256 | Exam question protection in browser |
| Email | Nodemailer + Gmail SMTP | OTP, welcome, notifications |
| File Upload | multer + xlsx | Bulk Excel import for students/questions |
| Rate Limiting | express-rate-limit | Brute force and DDoS protection |
| Frontend | React 18 + Vite | Component UI, fast HMR builds |
| SPA Routing | React Router v6 | Client-side navigation, protected routes |
| Animations | Framer Motion | Premium UI, exit animations |
| HTTP Client | Axios | JWT interceptors, API calls |
| Offline Storage | idb (IndexedDB) | Offline exam support, auto-save answers |
| Icons | Lucide React | Consistent, tree-shaken SVG icons |
| Deployment | Vercel | Free, global CDN, serverless Node.js support |
| Env Config | dotenv | Secrets management, dev/prod separation |
| Dev Restart | nodemon | Auto-restart on file changes in development |
