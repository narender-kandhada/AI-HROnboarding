# Mixed Content Error Fix Guide

## Understanding the Error

**Error Message:**
```
Mixed Content: The page at 'https://hronboarding.sumerudigital.com/pre-onboarding' 
was loaded over HTTPS, but requested an insecure resource 
'http://api.hronboarding.sumerudigital.com/employees/'. 
This request has been blocked; the content must be served over HTTPS.
```

## What is Mixed Content?

When a page is loaded over **HTTPS** (secure), browsers block any requests to **HTTP** (insecure) resources. This is a security feature to prevent man-in-the-middle attacks.

- ✅ **HTTPS page** → **HTTPS API** = ✅ Allowed
- ❌ **HTTPS page** → **HTTP API** = ❌ Blocked (Mixed Content)
- ✅ **HTTP page** → **HTTP API** = ✅ Allowed (development only)

## The Problem

Your frontend is served over HTTPS (`https://hronboarding.sumerudigital.com`), but the API URL in your `.env` file or build is set to HTTP (`http://api.hronboarding.sumerudigital.com`).

## Solution

### Step 1: Check Current Configuration

On your production server, check the `.env` file:

```bash
cd /var/www/AI-HR-Onboarding/frontend
cat .env | grep VITE_API_URL
```

**If it shows:**
```env
VITE_API_URL=http://api.hronboarding.sumerudigital.com
```

**It should be:**
```env
VITE_API_URL=https://api.hronboarding.sumerudigital.com
```

### Step 2: Update .env File

Edit the `.env` file:

```bash
cd /var/www/AI-HR-Onboarding/frontend
nano .env
```

**Update the line to use HTTPS:**
```env
VITE_API_URL=https://api.hronboarding.sumerudigital.com
```

**Important:**
- ✅ Use `https://` (not `http://`)
- ✅ No trailing slash at the end
- ✅ Match the exact domain

### Step 3: Rebuild Frontend

Since Vite embeds environment variables at build time, you **must rebuild**:

```bash
cd /var/www/AI-HR-Onboarding/frontend
npm run build
```

This will create a new `dist/` folder with the correct HTTPS URL.

### Step 4: Verify Build

Check the built files to ensure HTTPS is used:

```bash
cd /var/www/AI-HR-Onboarding/frontend/dist/assets
grep -r "http://api.hronboarding" . | head -5
# Should return nothing (no HTTP URLs)

grep -r "https://api.hronboarding" . | head -5
# Should show HTTPS URLs
```

### Step 5: Reload Web Server

```bash
# Reload Nginx
sudo systemctl reload nginx

# Or restart if needed
sudo systemctl restart nginx
```

### Step 6: Clear Browser Cache

**Critical:** Users must clear browser cache or do hard refresh:

- **Hard Refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- **Clear Cache**: Browser settings → Clear browsing data → Cached images and files

## Verification

### Method 1: Browser Console

1. Open `https://hronboarding.sumerudigital.com/pre-onboarding`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try to submit the pre-onboarding form
5. Look for: `📤 Pre-Onboarding - API URL: https://api.hronboarding.sumerudigital.com/employees`

### Method 2: Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to submit the form
4. Check the request URL - should be `https://api.hronboarding.sumerudigital.com/employees`
5. Should **NOT** show any mixed content errors

### Method 3: Check Built Files

```bash
# Check if HTTP is still in the build
cd /var/www/AI-HR-Onboarding/frontend/dist
grep -r "http://api.hronboarding" .

# If it returns results, the build is wrong - rebuild again
```

## Common Issues

### Issue 1: Still Shows HTTP After Rebuild

**Possible Causes:**
1. `.env` file not updated correctly
2. Build cached old values
3. Wrong `.env` file location

**Solutions:**
1. **Verify `.env` location:**
   ```bash
   cd /var/www/AI-HR-Onboarding/frontend
   ls -la .env
   # Should show .env file exists
   ```

2. **Check `.env` content:**
   ```bash
   cat .env
   # Should show: VITE_API_URL=https://api.hronboarding.sumerudigital.com
   ```

3. **Clear build cache and rebuild:**
   ```bash
   cd /var/www/AI-HR-Onboarding/frontend
   rm -rf dist node_modules/.vite
   npm run build
   ```

### Issue 2: Browser Still Shows Old URL

**Cause:** Browser cache

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. Or clear browser cache completely
3. Or use incognito/private browsing mode to test

### Issue 3: API Backend Not on HTTPS

If your API backend is not configured for HTTPS, you need to:

1. **Set up SSL certificate for API subdomain:**
   ```bash
   sudo certbot --nginx -d api.hronboarding.sumerudigital.com
   ```

2. **Configure Nginx for API HTTPS:**
   - Ensure API Nginx config listens on port 443
   - SSL certificate properly configured
   - Redirect HTTP to HTTPS

3. **Verify API is accessible:**
   ```bash
   curl https://api.hronboarding.sumerudigital.com/docs
   # Should return HTML (not error)
   ```

## Quick Fix Script

```bash
#!/bin/bash
# fix-mixed-content.sh

echo "🔒 Fixing Mixed Content Error..."

cd /var/www/AI-HR-Onboarding/frontend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Creating from env.example..."
    cp env.example .env
fi

# Update VITE_API_URL to HTTPS
echo "📝 Updating VITE_API_URL to HTTPS..."
if grep -q "VITE_API_URL" .env; then
    # Replace HTTP with HTTPS
    sed -i 's|VITE_API_URL=http://api.hronboarding|VITE_API_URL=https://api.hronboarding|' .env
    sed -i 's|VITE_API_URL=http://localhost:8000|VITE_API_URL=https://api.hronboarding.sumerudigital.com|' .env
    echo "✅ Updated existing VITE_API_URL"
else
    # Add new line
    echo "VITE_API_URL=https://api.hronboarding.sumerudigital.com" >> .env
    echo "✅ Added VITE_API_URL"
fi

# Verify the change
echo ""
echo "📋 Current VITE_API_URL:"
grep VITE_API_URL .env

# Clean build
echo ""
echo "🧹 Cleaning old build..."
rm -rf dist node_modules/.vite

# Rebuild
echo ""
echo "🔨 Rebuilding frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    echo ""
    echo "✅ Done! Clear browser cache and test."
    echo ""
    echo "💡 To verify:"
    echo "   1. Clear browser cache (Ctrl+Shift+R)"
    echo "   2. Check browser console for API URL"
    echo "   3. Should show: https://api.hronboarding.sumerudigital.com"
else
    echo ""
    echo "❌ Build failed! Check errors above."
    exit 1
fi
```

Make it executable:
```bash
chmod +x fix-mixed-content.sh
./fix-mixed-content.sh
```

## Production Checklist

- [ ] `.env` file has `VITE_API_URL=https://api.hronboarding.sumerudigital.com` (HTTPS)
- [ ] No trailing slash in API URL
- [ ] Frontend rebuilt with `npm run build`
- [ ] New `dist/` folder created
- [ ] Nginx serving from new `dist/` folder
- [ ] API backend accessible via HTTPS
- [ ] Browser cache cleared
- [ ] Tested in browser - no mixed content errors
- [ ] Browser console shows HTTPS URLs
- [ ] Network tab shows HTTPS requests

## Important Notes

1. **HTTPS Required**: When frontend is HTTPS, API must also be HTTPS
2. **Build Time**: Environment variables are embedded at build time, not runtime
3. **Cache**: Always clear browser cache after rebuilding
4. **SSL Certificate**: Ensure API subdomain has valid SSL certificate
5. **Nginx Config**: Ensure API Nginx config supports HTTPS

## Testing

### Test 1: Check API HTTPS
```bash
curl -I https://api.hronboarding.sumerudigital.com/docs
# Should return 200 OK
```

### Test 2: Check Frontend Build
```bash
cd /var/www/AI-HR-Onboarding/frontend/dist/assets
grep -r "https://api.hronboarding" . | head -1
# Should show HTTPS URLs
```

### Test 3: Browser Test
1. Open `https://hronboarding.sumerudigital.com/pre-onboarding`
2. Open Console (F12)
3. Submit form
4. Check console - should show HTTPS URL
5. Check Network tab - requests should be HTTPS

---

**Last Updated**: 2024  
**Related Files**:
- `frontend/.env` - Environment variables
- `frontend/src/utils/apiConfig.js` - API URL utility
- `frontend/src/pages/PreOnboarding.jsx` - Pre-onboarding component

