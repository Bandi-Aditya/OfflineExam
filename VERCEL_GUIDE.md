# Vercel Deployment Guide

I have prepared your project for deployment on Vercel. Follow these steps to get everything live:

## 1. Database Configuration
Ensure your MongoDB Atlas cluster has **Network Access** set to `0.0.0.0/0` (Allow access from anywhere) so Vercel's serverless functions can connect.

---

## 2. Deploy the Backend
1.  Navigate to the `backend` folder in your terminal.
2.  Run `vercel`.
3.  Go to the Vercel Dashboard for this new project and add these **Environment Variables**:
    *   `MONGODB_URI`: (Your cluster connection string)
    *   `JWT_SECRET`: (A strong random string)
    *   `ENCRYPTION_KEY`: `ABCDEF1234567890ABCDEF1234567890`
    *   `EMAIL_USER`: (Your Gmail)
    *   `EMAIL_APP_PASSWORD`: (Your App Password)
    *   `CLIENT_URL`: (Wait until Student App is deployed, then add it here)
    *   `ADMIN_URL`: (Wait until Admin Dashboard is deployed, then add it here)
4.  Copy your **Backend URL** (e.g., `https://exam-api.vercel.app`).

---

## 3. Deploy the Student App
1.  Navigate to the `student-app` folder.
2.  Run `vercel`.
3.  In the Vercel Dashboard, add this **Environment Variable**:
    *   `VITE_API_URL`: `https://your-backend-url.vercel.app/api`
4.  Copy the **Student App URL** and add it to the backend's `CLIENT_URL` variable.

---

## 4. Deploy the Admin Dashboard
1.  Navigate to the `admin-dashboard` folder.
2.  Run `vercel`.
3.  In the Vercel Dashboard, add this **Environment Variable**:
    *   `VITE_API_URL`: `https://your-backend-url.vercel.app/api`
4.  Copy the **Admin Dashboard URL** and add it to the backend's `ADMIN_URL` variable.

---

## Technical Changes Made:
- Added `vercel.json` to **Backend** to support Express as Serverless.
- Added `vercel.json` to **Frontends** to handle Single Page Application (SPA) routing.
- Enabled `VITE_API_URL` in both frontends for dynamic backend connection.
- Ensured all sensitive keys can be managed via the Vercel UI.
