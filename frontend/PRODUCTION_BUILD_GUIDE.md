# Production Build Guide - Fixing API URL Issue

## Problem

When the frontend is built, Vite **embeds** environment variables into the JavaScript bundle at build time. If you build the frontend without the production `.env` file, it will have `http://localhost:8000` hardcoded, even if you add the `.env` file later on the server.

## Solution

You need to **rebuild the frontend** on the production server with the correct `.env` file.

## Steps to Fix

### Step 1: Create/Update `.env` file in frontend directory

On your production server, navigate to the `frontend` directory and create/update the `.env` file:

```bash
cd /var/www/AI-HR-Onboarding/frontend
nano .env
```

**Important:** The URL should NOT have a trailing slash:
```env
# ✅ Correct
VITE_API_URL=https://api.hronboarding.sumerudigital.com

# ❌ Wrong (has trailing slash)
VITE_API_URL=https://api.hronboarding.sumerudigital.com/
```

### Step 2: Verify `.env` file

```bash
cat .env
```

Should show:
```
VITE_API_URL=https://api.hronboarding.sumerudigital.com
```

### Step 3: Rebuild the frontend

```bash
cd /var/www/AI-HR-Onboarding/frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build
```

This will create a new `dist/` folder with the correct API URL embedded.

### Step 4: Restart web server (if needed)

```bash
# If using Nginx, reload it
sudo systemctl reload nginx

# Or restart if needed
sudo systemctl restart nginx
```

### Step 5: Clear browser cache

Users should clear their browser cache or do a hard refresh:
- **Chrome/Firefox**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or clear browser cache completely

## Verification

### Method 1: Check browser console

1. Open the HR Login page
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Try to login
5. You should see: `🔐 HR Login - API URL: https://api.hronboarding.sumerudigital.com/auth/hr_login_post`

### Method 2: Check Network tab

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Look for the request to `/auth/hr_login_post`
5. Check the request URL - it should be `https://api.hronboarding.sumerudigital.com/auth/hr_login_post`

### Method 3: Check built files (advanced)

```bash
cd /var/www/AI-HR-Onboarding/frontend/dist/assets
grep -r "localhost:8000" .
# Should return nothing if correct

grep -r "api.hronboarding" .
# Should show the production URL
```

## Common Issues

### Issue 1: Still going to localhost

**Cause:** Frontend was not rebuilt with production `.env`

**Solution:** 
1. Ensure `.env` file exists with correct URL (no trailing slash)
2. Rebuild: `npm run build`
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)

### Issue 2: CORS errors

**Cause:** Backend CORS not configured for production domain

**Solution:** Check `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: 404 errors

**Cause:** API endpoint doesn't exist or URL is wrong

**Solution:**
1. Verify backend is running: `curl https://api.hronboarding.sumerudigital.com/docs`
2. Check API URL in `.env` (no trailing slash)
3. Check Nginx reverse proxy configuration

### Issue 4: Trailing slash causing double slashes

**Cause:** `.env` has trailing slash, causing URLs like `https://api...com//auth/...`

**Solution:** Remove trailing slash from `.env`:
```env
# ✅ Correct
VITE_API_URL=https://api.hronboarding.sumerudigital.com

# ❌ Wrong
VITE_API_URL=https://api.hronboarding.sumerudigital.com/
```

## Quick Fix Script

Create a script to rebuild quickly:

```bash
#!/bin/bash
# rebuild-frontend.sh

cd /var/www/AI-HR-Onboarding/frontend

echo "📝 Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ .env file exists"
cat .env | grep VITE_API_URL

echo ""
echo "🔨 Building frontend..."
npm run build

echo ""
echo "✅ Build complete!"
echo "📦 New files in dist/ directory"
echo ""
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Done! Clear browser cache and test."
```

Make it executable:
```bash
chmod +x rebuild-frontend.sh
./rebuild-frontend.sh
```

## Production Checklist

- [ ] `.env` file exists in `frontend/` directory
- [ ] `VITE_API_URL` is set correctly (no trailing slash)
- [ ] Frontend rebuilt with `npm run build`
- [ ] New `dist/` folder created
- [ ] Nginx serving from new `dist/` folder
- [ ] Browser cache cleared
- [ ] Tested login in browser
- [ ] Verified API URL in browser console/network tab

## Important Notes

1. **Build Time vs Runtime**: Vite environment variables are embedded at build time, not runtime
2. **No Trailing Slash**: Always remove trailing slash from API URL
3. **Cache**: Users must clear browser cache after rebuild
4. **Multiple Environments**: Use different `.env` files for dev/staging/prod
5. **Security**: Never commit `.env` files to version control

## Alternative: Runtime Configuration (Advanced)

If you need to change API URL without rebuilding, you can use a runtime config file:

1. Create `public/config.js`:
```javascript
window.APP_CONFIG = {
  API_URL: "https://api.hronboarding.sumerudigital.com"
};
```

2. Load it in `index.html`:
```html
<script src="/config.js"></script>
```

3. Use in code:
```javascript
const API_URL = window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
```

This allows changing API URL without rebuilding, but requires additional setup.

---

**Last Updated**: 2024  
**Related Files**: 
- `frontend/.env`
- `frontend/src/utils/apiConfig.js`
- `frontend/src/pages/HrLogin.jsx`

