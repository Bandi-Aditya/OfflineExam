# Vercel Deployment Guide

Complete guide for deploying the Secure Offline Examination System to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster (free tier works)
4. **GitHub Account** (optional, for automatic deployments)

---

## 🔧 Step 1: Database Configuration

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas Cluster** (if you haven't already)
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster

2. **Configure Network Access**
   - Go to **Network Access** in MongoDB Atlas
   - Click **Add IP Address**
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`)
   - This allows Vercel's serverless functions to connect

3. **Create Database User**
   - Go to **Database Access**
   - Create a new user with username and password
   - Save these credentials

4. **Get Connection String**
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/offline_exam_db?retryWrites=true&w=majority`

---

## 🚀 Step 2: Deploy the Backend

### 2.1 Initial Deployment

```bash
cd backend
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → `offline-exam-backend` (or your choice)
- **Directory?** → `./`
- **Override settings?** → No

### 2.2 Configure Environment Variables

Go to your Vercel Dashboard → Your Project → **Settings** → **Environment Variables**

Add the following variables (for **Production**, **Preview**, and **Development**):

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB connection string |
| `JWT_SECRET` | `your-random-secret-key-here` | Generate a strong random string (use `openssl rand -base64 32`) |
| `ENCRYPTION_KEY` | `ABCDEF1234567890ABCDEF1234567890` | 32-character encryption key |
| `NODE_ENV` | `production` | Environment mode |
| `CLIENT_URL` | `https://your-portal-client.vercel.app` | Will be set after Step 3 |
| `ADMIN_URL` | `https://your-admin-dashboard.vercel.app` | Will be set after Step 4 |

**Important**: 
- Click **Save** after adding each variable
- After adding all variables, go to **Deployments** tab and **Redeploy** the latest deployment

### 2.3 Get Backend URL

After deployment, copy your backend URL from the Vercel dashboard:
- Example: `https://offline-exam-backend.vercel.app`
- Note: The API will be available at `https://your-backend-url.vercel.app/api`

### 2.4 Test Backend

Visit: `https://your-backend-url.vercel.app/health`

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

---

## 🎓 Step 3: Deploy the Student Portal (portal-client)

### 3.1 Initial Deployment

```bash
cd portal-client
vercel
```

Follow the prompts (similar to backend)

### 3.2 Configure Environment Variables

In Vercel Dashboard → portal-client project → **Settings** → **Environment Variables**

Add:
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app/api` |

**Important**: Replace `your-backend-url` with your actual backend URL from Step 2.3

### 3.3 Redeploy

After adding the environment variable:
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment
- Wait for deployment to complete

### 3.4 Update Backend CORS

Go back to your **backend** project in Vercel:
- **Settings** → **Environment Variables**
- Update `CLIENT_URL` with your portal-client URL (e.g., `https://portal-client.vercel.app`)
- **Redeploy** the backend

---

## 👨‍💼 Step 4: Deploy the Admin Dashboard

### 4.1 Initial Deployment

```bash
cd admin-dashboard
vercel
```

### 4.2 Configure Environment Variables

In Vercel Dashboard → admin-dashboard project → **Settings** → **Environment Variables**

Add:
| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app/api` |

### 4.3 Redeploy

- Go to **Deployments** tab
- Click **Redeploy**

### 4.4 Update Backend CORS

Go back to your **backend** project:
- **Settings** → **Environment Variables**
- Update `ADMIN_URL` with your admin-dashboard URL
- **Redeploy** the backend

---

## ✅ Step 5: Verify Everything Works

1. **Test Backend Health**: `https://your-backend-url.vercel.app/health`
2. **Test Student Portal**: Open your portal-client URL and try logging in
3. **Test Admin Dashboard**: Open your admin-dashboard URL and try logging in

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /" or 404 errors

**Solution**: 
- Check that `vercel.json` exists in each project
- Ensure routes are configured correctly
- For frontend apps, `vercel.json` should have SPA routing

### Issue: CORS errors in browser console

**Solution**:
1. Verify `CLIENT_URL` and `ADMIN_URL` are set correctly in backend environment variables
2. Ensure URLs don't have trailing slashes
3. Redeploy backend after updating CORS variables
4. Check browser console for the exact origin being blocked

### Issue: "MongoDB connection failed"

**Solution**:
1. Verify `MONGODB_URI` is correct in Vercel environment variables
2. Check MongoDB Atlas Network Access allows `0.0.0.0/0`
3. Verify database user credentials are correct
4. Check MongoDB Atlas cluster is running (not paused)

### Issue: "401 Unauthorized" errors

**Solution**:
1. Verify `JWT_SECRET` is set in backend environment variables
2. Clear browser localStorage and try logging in again
3. Check that tokens are being sent in request headers

### Issue: Environment variables not working

**Solution**:
1. **VITE_ variables**: Must be prefixed with `VITE_` for Vite apps
2. After adding variables, **Redeploy** the project
3. Check variable names match exactly (case-sensitive)
4. Ensure variables are added to correct environment (Production/Preview/Development)

### Issue: Frontend can't connect to backend

**Solution**:
1. Verify `VITE_API_URL` is set correctly (should end with `/api`)
2. Check backend URL is accessible: `https://your-backend-url.vercel.app/health`
3. Check browser Network tab for actual API calls being made
4. Verify CORS is configured correctly

### Issue: Build fails on Vercel

**Solution**:
1. Check build logs in Vercel dashboard
2. Ensure `package.json` has correct build scripts
3. Verify Node.js version compatibility (Vercel uses Node 18.x by default)
4. Check for missing dependencies

### Issue: Slow API responses (Cold Starts)

**Solution**:
- This is normal for serverless functions
- First request after inactivity may take 1-3 seconds
- Subsequent requests are fast
- Consider using Vercel Pro for better performance

---

## 📝 Environment Variables Checklist

### Backend (`backend/`)
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `JWT_SECRET` - Random secret for JWT tokens
- [ ] `ENCRYPTION_KEY` - 32-character encryption key
- [ ] `CLIENT_URL` - Student portal URL
- [ ] `ADMIN_URL` - Admin dashboard URL
- [ ] `NODE_ENV` - Set to `production`

### Student Portal (`portal-client/`)
- [ ] `VITE_API_URL` - Backend API URL (ends with `/api`)

### Admin Dashboard (`admin-dashboard/`)
- [ ] `VITE_API_URL` - Backend API URL (ends with `/api`)

---

## 🔄 Updating Deployments

After making code changes:

1. **Backend**: `cd backend && vercel --prod`
2. **Student Portal**: `cd portal-client && vercel --prod`
3. **Admin Dashboard**: `cd admin-dashboard && vercel --prod`

Or push to GitHub and Vercel will auto-deploy (if connected).

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

---

## 🎉 Success!

Once all three projects are deployed and environment variables are configured:

- ✅ Backend API is accessible
- ✅ Student Portal can connect to backend
- ✅ Admin Dashboard can connect to backend
- ✅ CORS is properly configured
- ✅ Database connections work

Your Secure Offline Examination System is now live on Vercel!
