# 401 Unauthorized Error - Troubleshooting Guide

## Understanding the Error

The `/employees` POST endpoint requires:
1. **Valid JWT Token** in Authorization header
2. **HR Department** employee (verified via IT account)
3. **Valid Token Signature** (SECRET_KEY must match)

## Common Causes

### 1. Not Logged In (No Token)

**Symptom:** Token is `null` or `undefined` in localStorage

**Solution:**
- User must login first via HR Login page
- Token is stored in localStorage after successful login
- Check browser console: `localStorage.getItem("token")`

**Fix:**
```javascript
// In browser console:
localStorage.getItem("token")
// Should return a JWT token string, not null
```

### 2. Token Expired

**Symptom:** Token exists but is expired (default: 1 hour)

**Solution:**
- Login again to get a new token
- Or extend token expiration in backend (not recommended for security)

**Check Token Expiration:**
```javascript
// In browser console:
const token = localStorage.getItem("token");
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const exp = new Date(payload.exp * 1000);
  console.log("Token expires:", exp);
  console.log("Current time:", new Date());
  console.log("Is expired:", new Date() > exp);
}
```

### 3. Invalid SECRET_KEY

**Symptom:** Token can't be decoded (signature mismatch)

**Cause:** 
- SECRET_KEY in production `.env` doesn't match the key used to create the token
- Token was created with a different SECRET_KEY

**Solution:**
1. Check backend `.env` file:
   ```bash
   cd /var/www/AI-HR-Onboarding/backend
   cat .env | grep SECRET_KEY
   ```

2. Verify SECRET_KEY is set correctly

3. If changed, users must login again (old tokens won't work)

### 4. User Not HR Department

**Symptom:** Token is valid but user's department is not "HR"

**Solution:**
1. Check employee's department in database:
   ```sql
   SELECT emp_id, name, department FROM employees WHERE email = 'hr@company.com';
   ```

2. Update department to "HR":
   ```sql
   UPDATE employees SET department = 'HR' WHERE email = 'hr@company.com';
   ```

3. User must login again after department change

### 5. No IT Account

**Symptom:** Employee doesn't have an IT account

**Solution:**
1. Create IT account for HR employee:
   - Go to IT Account Management page
   - Create account with company email
   - Set password

2. Employee must login using company email (IT account email)

### 6. Wrong Email/Token Mismatch

**Symptom:** Token contains email that doesn't match any IT account

**Solution:**
1. Verify IT account exists:
   ```sql
   SELECT * FROM it_accounts WHERE company_email = 'hr@company.com';
   ```

2. Verify employee is linked:
   ```sql
   SELECT e.*, it.company_email 
   FROM employees e 
   JOIN it_accounts it ON e.emp_id = it.employee_id 
   WHERE it.company_email = 'hr@company.com';
   ```

## Step-by-Step Troubleshooting

### Step 1: Check Token in Browser

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Run:
   ```javascript
   localStorage.getItem("token")
   ```

**Expected:** Should return a JWT token string (long string starting with `eyJ...`)

**If null:** User needs to login

### Step 2: Check Token Validity

In browser console:
```javascript
const token = localStorage.getItem("token");
if (!token) {
  console.log("❌ No token found - please login");
} else {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log("❌ Invalid token format");
    } else {
      const payload = JSON.parse(atob(parts[1]));
      console.log("✅ Token payload:", payload);
      console.log("📧 Email:", payload.sub);
      const exp = new Date(payload.exp * 1000);
      console.log("⏰ Expires:", exp);
      console.log("⏰ Is expired:", new Date() > exp);
    }
  } catch (e) {
    console.log("❌ Error parsing token:", e);
  }
}
```

### Step 3: Check Backend Logs

```bash
# Check backend logs for authentication errors
sudo journalctl -u ai-hr-backend -n 50 | grep -i "401\|unauthorized\|token\|jwt"
```

Look for:
- "Invalid token"
- "JWTError"
- "Not authenticated"

### Step 4: Verify SECRET_KEY

```bash
cd /var/www/AI-HR-Onboarding/backend
cat .env | grep SECRET_KEY
```

Ensure it's set and matches the key used to create tokens.

### Step 5: Test API Directly

```bash
# Get token from browser console first
TOKEN="your-token-here"

# Test the endpoint
curl -X POST https://api.hronboarding.sumerudigital.com/employees/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "emp_id": "SDS10001",
    "name": "Test User",
    "email": "test@example.com",
    "department": "hr",
    "role": "Recruiter"
  }'
```

**If 401:** Token is invalid/expired
**If 403:** User is not HR department
**If 200:** Token is valid, issue is in frontend

## Quick Fixes

### Fix 1: Force Re-login

```javascript
// In browser console
localStorage.removeItem("token");
window.location.href = "/hr-login";
```

### Fix 2: Check HR Department

```sql
-- In database
SELECT emp_id, name, email, department 
FROM employees 
WHERE department = 'HR';
```

### Fix 3: Verify IT Account

```sql
-- In database
SELECT e.emp_id, e.name, e.department, it.company_email
FROM employees e
JOIN it_accounts it ON e.emp_id = it.employee_id
WHERE e.department = 'HR';
```

## Production Checklist

- [ ] User is logged in (token exists in localStorage)
- [ ] Token is not expired
- [ ] SECRET_KEY is set correctly in backend `.env`
- [ ] Employee has department set to "HR"
- [ ] Employee has IT account created
- [ ] IT account email matches token email
- [ ] Backend is running and accessible
- [ ] CORS is configured correctly
- [ ] Network request shows Authorization header

## Debug Script

Add this to browser console to debug:

```javascript
async function debugAuth() {
  const token = localStorage.getItem("token");
  
  console.log("=== Authentication Debug ===");
  console.log("1. Token exists:", !!token);
  
  if (!token) {
    console.log("❌ No token - please login");
    return;
  }
  
  // Parse token
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    console.log("2. Token payload:", payload);
    console.log("3. Email:", payload.sub);
    console.log("4. Expires:", new Date(payload.exp * 1000));
    console.log("5. Is expired:", new Date() > new Date(payload.exp * 1000));
  } catch (e) {
    console.log("❌ Error parsing token:", e);
    return;
  }
  
  // Test API
  console.log("\n6. Testing API...");
  try {
    const res = await fetch('https://api.hronboarding.sumerudigital.com/employees/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        emp_id: "TEST001",
        name: "Test",
        email: "test@test.com",
        department: "hr",
        role: "Recruiter"
      })
    });
    
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
    
    if (res.status === 401) {
      console.log("❌ 401 Unauthorized - Token invalid or expired");
    } else if (res.status === 403) {
      console.log("❌ 403 Forbidden - Not HR department");
    } else if (res.status === 200 || res.status === 201) {
      console.log("✅ Authentication successful!");
    }
  } catch (e) {
    console.log("❌ Network error:", e);
  }
}

// Run it
debugAuth();
```

## Common Solutions

### Solution 1: Login Again

1. Go to HR Login page
2. Enter company email and password
3. Login successfully
4. Try Pre-Onboarding again

### Solution 2: Check Employee Department

```sql
UPDATE employees 
SET department = 'HR' 
WHERE email = 'hr@company.com';
```

### Solution 3: Verify SECRET_KEY

```bash
# Check if SECRET_KEY is set
cd /var/www/AI-HR-Onboarding/backend
grep SECRET_KEY .env

# If not set or wrong, generate new one
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Then update `.env` and restart backend:
```bash
sudo systemctl restart ai-hr-backend
```

**Note:** All users will need to login again after changing SECRET_KEY.

---

**Last Updated**: 2024  
**Related Files**:
- `backend/app/dependencies.py` - Authentication dependency
- `backend/app/routes/employee.py` - Employee creation endpoint
- `frontend/src/pages/PreOnboarding.jsx` - Pre-onboarding form

