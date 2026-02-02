# Debugging "Route not found" Error on Vercel

## Quick Checks

### 1. Verify Backend is Running
Test the root endpoint:
```
https://your-backend-url.vercel.app/
```

Should return a JSON with available endpoints.

### 2. Test Health Endpoint
```
https://your-backend-url.vercel.app/health
```

Should return:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

### 3. Check API Route Format

**✅ Correct API URLs:**
- `https://your-backend.vercel.app/api/auth/login`
- `https://your-backend.vercel.app/api/admin/exams`
- `https://your-backend.vercel.app/api/student/exams/assigned`

**❌ Wrong URLs:**
- `https://your-backend.vercel.app/auth/login` (missing `/api`)
- `https://your-backend.vercel.app/api/auth/login/` (trailing slash might cause issues)

### 4. Check Frontend API Configuration

In your frontend projects, verify `VITE_API_URL` is set correctly:

**portal-client** and **admin-dashboard**:
```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

**Important**: Must end with `/api`, not just the base URL.

### 5. Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Make a request (e.g., login)
4. Check the actual URL being called
5. Check the response status and body

### 6. Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Select your backend project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Go to **Functions** tab
6. Click on the function
7. Check **Logs** for errors

Look for:
- Route matching logs (should show `GET /api/...`)
- Database connection errors
- Any error messages

## Common Issues

### Issue: Routes work locally but not on Vercel

**Cause**: Environment variables not set or database connection failing

**Fix**:
1. Verify all environment variables in Vercel Dashboard
2. Check MongoDB Atlas Network Access allows `0.0.0.0/0`
3. Redeploy after adding environment variables

### Issue: CORS errors

**Cause**: `CLIENT_URL` or `ADMIN_URL` not set correctly

**Fix**:
1. Set `CLIENT_URL` in backend environment variables
2. Set `ADMIN_URL` in backend environment variables
3. Redeploy backend

### Issue: 404 on all routes

**Cause**: Vercel routing configuration issue

**Fix**:
1. Verify `vercel.json` exists in `backend/` folder
2. Ensure it has the correct routing configuration
3. Redeploy

### Issue: Database connection errors

**Cause**: MongoDB URI incorrect or network access not configured

**Fix**:
1. Verify `MONGODB_URI` in Vercel environment variables
2. Check MongoDB Atlas Network Access
3. Test connection string locally first

## Testing Routes Manually

Use curl or Postman to test routes:

```bash
# Health check
curl https://your-backend.vercel.app/health

# Root endpoint
curl https://your-backend.vercel.app/

# Login (example)
curl -X POST https://your-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"studentId":"ADMIN001","password":"admin123"}'
```

## What to Check in Logs

When you see "Route not found", check Vercel logs for:

1. **Request path**: What path was requested?
   ```
   Request Path: /api/auth/login
   ```

2. **Method**: What HTTP method was used?
   ```
   Request Method: POST
   ```

3. **Database connection**: Is MongoDB connected?
   ```
   ✅ MongoDB Connected: ...
   ```

4. **Route registration**: Are routes being registered?
   - Check if you see route logs before the 404

## Still Not Working?

1. **Redeploy everything**:
   ```bash
   cd backend && vercel --prod
   ```

2. **Check Vercel build logs** for any errors during deployment

3. **Verify file structure**:
   - `backend/vercel.json` exists
   - `backend/src/server.js` exists
   - All route files exist in `backend/src/routes/`

4. **Test with a simple route**:
   - Try `/health` endpoint first
   - Then try `/` endpoint
   - Then try `/api/auth/login`

If `/health` works but `/api/*` routes don't, the issue is with route registration or path matching.
