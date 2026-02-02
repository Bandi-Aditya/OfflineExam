# Vercel Deployment Troubleshooting Quick Reference

## 🔍 Common Issues and Quick Fixes

### 1. Backend Not Starting / 500 Errors

**Symptoms**: Backend returns 500 errors or doesn't respond

**Quick Checks**:
- ✅ Verify `MONGODB_URI` is set correctly
- ✅ Check MongoDB Atlas Network Access allows `0.0.0.0/0`
- ✅ Verify all required environment variables are set
- ✅ Check Vercel function logs: Dashboard → Deployments → Click deployment → Functions tab

**Fix**: 
```bash
# Redeploy backend
cd backend
vercel --prod
```

---

### 2. CORS Errors in Browser

**Symptoms**: Browser console shows CORS errors like:
```
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```

**Quick Fix**:
1. Go to Backend project → Settings → Environment Variables
2. Verify `CLIENT_URL` matches your portal-client URL exactly (no trailing slash)
3. Verify `ADMIN_URL` matches your admin-dashboard URL exactly
4. Redeploy backend

**Example**:
```
CLIENT_URL=https://portal-client.vercel.app
ADMIN_URL=https://admin-dashboard.vercel.app
```

---

### 3. Frontend Can't Connect to Backend

**Symptoms**: Network requests fail, 404 or connection errors

**Quick Checks**:
- ✅ Verify `VITE_API_URL` is set in frontend environment variables
- ✅ Ensure URL ends with `/api`: `https://backend.vercel.app/api`
- ✅ Test backend health endpoint: `https://backend.vercel.app/health`
- ✅ Check browser Network tab to see actual request URL

**Fix**:
1. Update `VITE_API_URL` in Vercel dashboard
2. Redeploy frontend project

---

### 4. Environment Variables Not Working

**Symptoms**: App still uses default/localhost URLs

**Quick Fix**:
1. **VITE_ prefix required**: Frontend env vars MUST start with `VITE_`
2. **Redeploy after changes**: Environment variables require redeployment
3. **Check all environments**: Set variables for Production, Preview, AND Development

**Correct Format**:
```
✅ VITE_API_URL=https://backend.vercel.app/api
❌ API_URL=https://backend.vercel.app/api (won't work in Vite)
```

---

### 5. MongoDB Connection Timeout

**Symptoms**: Backend logs show MongoDB connection errors

**Quick Fix**:
1. **MongoDB Atlas Network Access**:
   - Go to MongoDB Atlas → Network Access
   - Add IP: `0.0.0.0/0` (Allow from anywhere)
   - Wait 1-2 minutes for changes to propagate

2. **Connection String**:
   - Verify password is URL-encoded if it contains special characters
   - Check connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`

3. **Database User**:
   - Verify user has read/write permissions
   - Check username and password are correct

---

### 6. Build Failures

**Symptoms**: Deployment fails during build phase

**Common Causes**:
- Missing dependencies in `package.json`
- Node.js version incompatibility
- Build script errors

**Quick Fix**:
1. Check build logs in Vercel dashboard
2. Test build locally: `npm run build`
3. Verify Node.js version in `package.json`:
   ```json
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

---

### 7. Slow First Request (Cold Start)

**Symptoms**: First API request takes 2-5 seconds, then fast

**Explanation**: This is normal for serverless functions. Vercel "freezes" unused functions.

**Solutions**:
- This is expected behavior on free tier
- Subsequent requests are fast
- Consider Vercel Pro for better performance
- Use Vercel Cron Jobs to keep functions warm (if needed)

---

### 8. 404 on Page Refresh (Frontend)

**Symptoms**: Direct URL access or page refresh returns 404

**Quick Fix**: 
- Verify `vercel.json` exists in frontend projects
- Ensure it has SPA routing configuration:
  ```json
  {
    "routes": [
      { "handle": "filesystem" },
      { "src": "/(.*)", "dest": "/index.html" }
    ]
  }
  ```

---

## 🚨 Emergency Checklist

If nothing works, go through this checklist:

1. **Backend Health Check**
   ```
   https://your-backend.vercel.app/health
   ```
   Should return JSON with `success: true`

2. **Environment Variables**
   - [ ] Backend: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `ADMIN_URL`
   - [ ] Portal: `VITE_API_URL`
   - [ ] Admin: `VITE_API_URL`

3. **MongoDB Atlas**
   - [ ] Network Access: `0.0.0.0/0` added
   - [ ] Database user created
   - [ ] Connection string is correct

4. **Redeploy Everything**
   ```bash
   cd backend && vercel --prod
   cd ../portal-client && vercel --prod
   cd ../admin-dashboard && vercel --prod
   ```

5. **Check Logs**
   - Vercel Dashboard → Deployments → Click deployment → Functions/Logs tabs
   - Look for error messages

---

## 📞 Getting Help

1. **Check Vercel Logs**: Dashboard → Your Project → Deployments → Click deployment
2. **Check Browser Console**: F12 → Console tab for frontend errors
3. **Check Network Tab**: F12 → Network tab to see API requests
4. **Test Backend Directly**: Use Postman or curl to test API endpoints

---

## ✅ Verification Steps

After deployment, verify:

1. **Backend**: `https://backend.vercel.app/health` → Returns JSON
2. **Portal Login**: Can you log in? Check Network tab for API calls
3. **Admin Login**: Can you log in? Check Network tab for API calls
4. **CORS**: No CORS errors in browser console
5. **Database**: Can create/view data (exams, students, etc.)

If all 5 pass, your deployment is successful! 🎉
