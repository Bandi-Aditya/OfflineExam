# Testing Login Endpoint

## ✅ Good News!
The response you got means:
- ✅ Routes are registered correctly
- ✅ The `/api/auth/login` endpoint exists
- ✅ It's just telling you to use POST instead of GET

## How to Test Login (POST Request)

### Option 1: Using curl (Command Line)

```bash
curl -X POST https://backend-k40luobz7-bandi-adityas-projects.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"studentId\":\"ADMIN001\",\"password\":\"admin123\"}"
```

### Option 2: Using PowerShell (Windows)

```powershell
$body = @{
    studentId = "ADMIN001"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://backend-k40luobz7-bandi-adityas-projects.vercel.app/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Option 3: Using Postman

1. Open Postman
2. Create a new request
3. Set method to **POST**
4. URL: `https://backend-k40luobz7-bandi-adityas-projects.vercel.app/api/auth/login`
5. Go to **Headers** tab:
   - Key: `Content-Type`
   - Value: `application/json`
6. Go to **Body** tab:
   - Select **raw**
   - Select **JSON** from dropdown
   - Paste this:
   ```json
   {
     "studentId": "ADMIN001",
     "password": "admin123"
   }
   ```
7. Click **Send**

### Option 4: Using Your Frontend App

Just use your admin-dashboard or portal-client app - they will automatically send POST requests!

## Expected Success Response

If login is successful, you should get:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "studentId": "ADMIN001",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

## Test Credentials

**Admin:**
- Student ID: `ADMIN001`
- Password: `admin123`

**Student:**
- Student ID: `STU001`
- Password: `student123`
