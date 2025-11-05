# CORS Fix Guide

## Problem

When `allow_credentials=True` in FastAPI CORS middleware, you **cannot** use `allow_origins=["*"]`. The browser blocks requests due to security restrictions.

**Error Message:**
```
Access to fetch at 'https://api.hronboarding.sumerudigital.com/...' from origin 'https://hronboarding.sumerudigital.com' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

The backend now supports explicit CORS origins configuration. You have two options:

### Option 1: Use Default Origins (Quick Fix)

The code now includes default allowed origins:
- `https://hronboarding.sumerudigital.com` (production)
- `http://hronboarding.sumerudigital.com` (production with http)
- Local development ports (localhost:3000, 3001, 5173)

**Steps:**
1. Restart the backend server:
   ```bash
   sudo systemctl restart ai-hr-backend
   ```

2. Check logs to verify CORS origins:
   ```bash
   sudo journalctl -u ai-hr-backend -n 50 | grep "CORS"
   ```
   Should show: `🌐 CORS Allowed Origins: [...]`

3. Test the frontend - CORS should work now!

### Option 2: Configure via Environment Variable (Recommended)

For more control, set `ALLOWED_ORIGINS` in your `.env` file.

**Steps:**

1. Edit `.env` file in backend directory:
   ```bash
   cd /var/www/AI-HR-Onboarding/backend
   nano .env
   ```

2. Add or update `ALLOWED_ORIGINS`:
   ```env
   ALLOWED_ORIGINS=https://hronboarding.sumerudigital.com,https://www.hronboarding.sumerudigital.com
   ```
   
   **For multiple origins**, separate with commas (no spaces needed, but spaces are automatically trimmed):
   ```env
   ALLOWED_ORIGINS=https://hronboarding.sumerudigital.com,https://www.hronboarding.sumerudigital.com,http://localhost:3000
   ```

3. Save and exit (Ctrl+X, then Y, then Enter)

4. Restart the backend:
   ```bash
   sudo systemctl restart ai-hr-backend
   ```

5. Verify CORS is configured:
   ```bash
   sudo journalctl -u ai-hr-backend -n 20 | grep "CORS"
   ```

## Verification

### Method 1: Check Backend Logs

```bash
sudo journalctl -u ai-hr-backend -f
```

When the server starts, you should see:
```
🌐 CORS Allowed Origins: ['https://hronboarding.sumerudigital.com', ...]
```

### Method 2: Test with curl

```bash
curl -X OPTIONS https://api.hronboarding.sumerudigital.com/employees \
  -H "Origin: https://hronboarding.sumerudigital.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Look for:
```
< access-control-allow-origin: https://hronboarding.sumerudigital.com
< access-control-allow-credentials: true
```

### Method 3: Test in Browser

1. Open frontend: `https://hronboarding.sumerudigital.com`
2. Open browser Developer Tools (F12)
3. Go to Network tab
4. Try to perform an action (e.g., HR login or pre-onboarding)
5. Check the request - should succeed without CORS errors

## Common Issues

### Issue 1: Still Getting CORS Errors

**Possible Causes:**
1. Backend not restarted after config change
2. Wrong origin in `ALLOWED_ORIGINS`
3. Nginx or proxy blocking CORS headers

**Solutions:**
1. **Restart backend:**
   ```bash
   sudo systemctl restart ai-hr-backend
   ```

2. **Check exact origin:**
   - Open browser console
   - Check the exact URL in the error message
   - Ensure it matches exactly in `ALLOWED_ORIGINS` (including http/https)

3. **Check Nginx config:**
   - Ensure Nginx is not stripping CORS headers
   - Verify proxy_pass is correct

### Issue 2: Development Not Working

If local development stops working, add localhost origins:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173,https://hronboarding.sumerudigital.com
```

### Issue 3: Multiple Environments

For different environments, use different `.env` files or set environment variables:

**Development:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

**Production:**
```env
ALLOWED_ORIGINS=https://hronboarding.sumerudigital.com,https://www.hronboarding.sumerudigital.com
```

## Important Notes

1. **Exact Match Required**: The origin must match exactly (including protocol: http vs https)

2. **No Wildcards**: When `allow_credentials=True`, you cannot use `*` or wildcards

3. **Subdomains**: Each subdomain needs to be listed separately:
   ```env
   ALLOWED_ORIGINS=https://hronboarding.sumerudigital.com,https://www.hronboarding.sumerudigital.com,https://admin.hronboarding.sumerudigital.com
   ```

4. **Protocol Matters**: `http://` and `https://` are different origins

5. **Port Matters**: `http://localhost:3000` and `http://localhost:3001` are different origins

## Quick Fix Script

```bash
#!/bin/bash
# fix-cors.sh

echo "🔧 Fixing CORS configuration..."

cd /var/www/AI-HR-Onboarding/backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Add or update ALLOWED_ORIGINS
if grep -q "ALLOWED_ORIGINS" .env; then
    echo "✅ ALLOWED_ORIGINS already exists, updating..."
    sed -i 's|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://hronboarding.sumerudigital.com|' .env
else
    echo "➕ Adding ALLOWED_ORIGINS to .env..."
    echo "" >> .env
    echo "# CORS Configuration" >> .env
    echo "ALLOWED_ORIGINS=https://hronboarding.sumerudigital.com" >> .env
fi

echo "✅ Configuration updated"
echo ""
echo "🔄 Restarting backend..."
sudo systemctl restart ai-hr-backend

echo ""
echo "✅ Done! Check logs:"
echo "   sudo journalctl -u ai-hr-backend -n 20 | grep CORS"
```

Make it executable:
```bash
chmod +x fix-cors.sh
./fix-cors.sh
```

## Testing Checklist

- [ ] Backend restarted after config change
- [ ] CORS origins logged correctly on startup
- [ ] Frontend can make requests without CORS errors
- [ ] Pre-flight OPTIONS requests succeed
- [ ] Actual POST/GET requests work
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows correct CORS headers

---

**Last Updated**: 2024  
**Related Files**:
- `backend/app/main.py` - CORS middleware configuration
- `backend/.env` - Environment variables
- `backend/env.example` - Example configuration

