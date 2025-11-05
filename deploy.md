# 🚀 Deployment Guide - AI HR Onboarding System

This guide provides detailed step-by-step instructions for deploying the AI HR Onboarding system to a Linux server for testing.

---

## 📋 Table of Contents

1. [Server Requirements](#server-requirements)
2. [Prerequisites Installation](#prerequisites-installation)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL/HTTPS Setup (Optional)](#sslhttps-setup-optional)
8. [Process Management](#process-management)
9. [Testing the Deployment](#testing-the-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Post-Deployment Checklist](#post-deployment-checklist)

---

## 🖥️ Server Requirements

### Minimum Server Specifications
- **OS**: Ubuntu 20.04 LTS or later (recommended), or any Linux distribution
- **RAM**: 2GB minimum (4GB recommended)
- **CPU**: 2 cores minimum
- **Storage**: 20GB minimum free space
- **Network**: Static IP address or domain name

### Required Software
- Python 3.8 or higher
- Node.js 16+ and npm
- MySQL 5.7+ or MariaDB 10.3+
- Nginx (for serving frontend and reverse proxy)
- Git

---

## 🔧 Prerequisites Installation

### Step 1: Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Python and pip

```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version  # Should show Python 3.8 or higher
```

### Step 3: Install Node.js and npm

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # Should show v18.x or higher
npm --version    # Should show npm version
```

### Step 4: Install MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

**During MySQL setup:**
- Set root password (remember this for later)
- Remove anonymous users: Yes
- Disallow root login remotely: Yes (unless you need remote access)
- Remove test database: Yes
- Reload privilege tables: Yes

### Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 6: Install Git

```bash
sudo apt install -y git
```

### Step 7: Install Process Manager

```bash
# Install supervisor for Python process management
sudo apt install -y supervisor
```

---

## 🗄️ Database Setup

### Step 1: Create Database and User

```bash
sudo mysql -u root -p
```

In MySQL prompt:

```sql
-- Create database
CREATE DATABASE ai_hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_username' and 'your_password' with your values)
CREATE USER 'ai_hr_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON ai_hr_db.* TO 'ai_hr_user'@'localhost';

-- Reload privileges
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Step 2: Verify Database Creation

```bash
mysql -u ai_hr_user -p ai_hr_db -e "SHOW TABLES;"
```

---

## 🔙 Backend Deployment

### Step 1: Clone or Upload Project

```bash
# Option A: Clone from Git repository.
cd /var/www
sudo git clone <your-repository-url> AI-HR-Onboarding
sudo chown -R $USER:$USER AI-HR-Onboarding
cd AI-HR-Onboarding

# Option B: Upload via SCP/SFTP
# Upload project files to /var/www/AI-HR-Onboarding
```

### Step 2: Set Up Python Virtual Environment

```bash
cd /var/www/AI-HR-Onboarding/backend
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Generate Security Keys

```bash
# Generate all keys at once (recommended)
python generate_all_keys.py

# OR generate individually:
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate IT_ENCRYPTION_KEY
python generate_key.py
```

**⚠️ Save the generated keys - you'll need them for the .env file!**

### Step 5: Create Backend .env File

```bash
cd /var/www/AI-HR-Onboarding/backend
cp env.example .env
nano .env
```

Edit the `.env` file with your production values:

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://ai_hr_user:your_secure_password_here@localhost:3306/ai_hr_db

# Security Keys (use the keys you generated in Step 4)
SECRET_KEY=your-generated-secret-key-here
IT_ENCRYPTION_KEY=your-generated-fernet-key-here

# AI API Keys
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here  # Optional

# Email Configuration (if not using Hostinger, update backend/app/utils/email.py)
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 6: Test Backend Connection

```bash
# Activate virtual environment (if not already activated)
source venv/bin/activate

# Test database connection
python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine); print('Database connection successful!')"

# Start backend server manually to test
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Expected output:** Server should start and show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Press `Ctrl+C` to stop the server.

### Step 7: Create Systemd Service for Backend

```bash
sudo nano /etc/systemd/system/ai-hr-backend.service
```

Add the following content:

```ini
[Unit]
Description=AI HR Onboarding Backend API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/AI-HR-Onboarding/backend
Environment="PATH=/var/www/AI-HR-Onboarding/backend/venv/bin"
ExecStart=/var/www/AI-HR-Onboarding/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Save and exit**, then:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable ai-hr-backend

# Start the service
sudo systemctl start ai-hr-backend

# Check status
sudo systemctl status ai-hr-backend

# View logs
sudo journalctl -u ai-hr-backend -f
```

**Expected output:** Status should show "active (running)"

---

## 🎨 Frontend Deployment

### Step 1: Navigate to Frontend Directory

```bash
cd /var/www/AI-HR-Onboarding/frontend
```

### Step 2: Install Node Dependencies

```bash
npm install
```

If you encounter peer dependency issues:

```bash
npm install --legacy-peer-deps
```

### Step 3: Create Frontend .env File

```bash
cp env.example .env
nano .env
```

Edit the `.env` file:

```env
# Backend API URL (use your server's IP or domain)
# For testing: http://YOUR_SERVER_IP:8000
# For production with domain: https://api.yourdomain.com
VITE_API_URL=http://YOUR_SERVER_IP:8000
```

**Replace `YOUR_SERVER_IP` with your actual server IP address or domain name.**

Save and exit.

### Step 4: Build Frontend for Production

```bash
npm run build
```

This will create a `dist/` directory with optimized production files.

**Verify build:**
```bash
ls -la dist/
```

You should see `index.html` and an `assets/` directory.

### Step 5: Configure Nginx for Frontend

```bash
sudo nano /etc/nginx/sites-available/ai-hr-frontend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP_OR_DOMAIN;

    # Frontend static files
    root /var/www/AI-HR-Onboarding/frontend/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/ai-hr-frontend-access.log;
    error_log /var/log/nginx/ai-hr-frontend-error.log;

    # Frontend routes - serve index.html for all routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Replace `YOUR_SERVER_IP_OR_DOMAIN` with your server IP or domain name.**

Save and exit, then:

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/ai-hr-frontend /etc/nginx/sites-enabled/

# Remove default nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 6: Configure Nginx as Reverse Proxy for Backend

```bash
sudo nano /etc/nginx/sites-available/ai-hr-backend
```

Add the following configuration:

```nginx
server {
    listen 8080;
    server_name YOUR_SERVER_IP_OR_DOMAIN;

    # Logging
    access_log /var/log/nginx/ai-hr-backend-access.log;
    error_log /var/log/nginx/ai-hr-backend-error.log;

    # Increase body size for file uploads
    client_max_body_size 10M;

    # Proxy to FastAPI backend
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Save and exit, then:

```bash
# Enable backend site
sudo ln -s /etc/nginx/sites-available/ai-hr-backend /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

**Alternative: Single Nginx Configuration (Recommended)**

You can also combine both configurations in a single file:

```bash
sudo nano /etc/nginx/sites-available/ai-hr-app
```

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP_OR_DOMAIN;

    # Frontend static files
    root /var/www/AI-HR-Onboarding/frontend/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/ai-hr-access.log;
    error_log /var/log/nginx/ai-hr-error.log;

    # Frontend routes - serve index.html for all routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase body size for file uploads
        client_max_body_size 10M;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Important:** If using this combined configuration, update your frontend `.env` to:
```env
VITE_API_URL=http://YOUR_SERVER_IP_OR_DOMAIN/api
```

---

## 🔒 SSL/HTTPS Setup (Optional but Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically, but test it:
sudo certbot renew --dry-run
```

Update Nginx configuration to use HTTPS (certbot will do this automatically).

---

## 🛠️ Process Management

### Backend Service Management

```bash
# Start backend
sudo systemctl start ai-hr-backend

# Stop backend
sudo systemctl stop ai-hr-backend

# Restart backend
sudo systemctl restart ai-hr-backend

# Check status
sudo systemctl status ai-hr-backend

# View logs
sudo journalctl -u ai-hr-backend -f

# View last 100 lines of logs
sudo journalctl -u ai-hr-backend -n 100
```

### Nginx Service Management

```bash
# Start nginx
sudo systemctl start nginx

# Stop nginx
sudo systemctl stop nginx

# Restart nginx
sudo systemctl restart nginx

# Reload configuration (without downtime)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Firewall Configuration

```bash
# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp

# Allow SSH (port 22) - Important!
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

---

## ✅ Testing the Deployment

### Step 1: Test Backend API

```bash
# Test if backend is running
curl http://localhost:8000/docs

# Test API health
curl http://localhost:8000/
```

**Expected:** Should return HTML or JSON response.

### Step 2: Test Frontend

Open your browser and navigate to:
```
http://YOUR_SERVER_IP_OR_DOMAIN
```

**Expected:** Should show the HR Onboarding frontend interface.

### Step 3: Test API Connection from Frontend

1. Open browser developer tools (F12)
2. Navigate to Network tab
3. Try to log in or load any page
4. Check if API calls are successful (status 200)

### Step 4: Test Key Functionalities

1. **HR Login**
   - Navigate to HR Login page
   - Test login functionality

2. **API Documentation**
   - Visit `http://YOUR_SERVER_IP:8000/docs` or `http://YOUR_SERVER_IP/api/docs`
   - Test API endpoints from Swagger UI

3. **Database Connection**
   - Check if tables are created automatically
   - Verify data can be inserted

4. **File Uploads**
   - Test document upload functionality
   - Verify files are stored correctly

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Backend service won't start**
```bash
# Check service status
sudo systemctl status ai-hr-backend

# Check logs
sudo journalctl -u ai-hr-backend -n 50

# Common issues:
# 1. Virtual environment not activated in service file
# 2. .env file missing or incorrect
# 3. Database connection failed
# 4. Port 8000 already in use
```

**Problem: Database connection error**
```bash
# Test MySQL connection
mysql -u ai_hr_user -p ai_hr_db

# Check if MySQL is running
sudo systemctl status mysql

# Verify .env file has correct DATABASE_URL
cat /var/www/AI-HR-Onboarding/backend/.env | grep DATABASE_URL
```

**Problem: Port 8000 already in use**
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill the process (replace PID with actual process ID)
sudo kill -9 PID

# Or change port in service file and frontend .env
```

### Frontend Issues

**Problem: Frontend shows blank page**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/ai-hr-error.log

# Verify dist directory exists
ls -la /var/www/AI-HR-Onboarding/frontend/dist

# Check Nginx configuration
sudo nginx -t

# Rebuild frontend
cd /var/www/AI-HR-Onboarding/frontend
npm run build
```

**Problem: API calls failing (CORS or 404)**
```bash
# Check if VITE_API_URL is correct in .env
cat /var/www/AI-HR-Onboarding/frontend/.env

# Check Nginx backend proxy configuration
sudo cat /etc/nginx/sites-available/ai-hr-backend

# Check browser console for errors (F12)
# Common issues:
# 1. CORS errors - check backend CORS settings
# 2. 404 errors - check API URL in frontend .env
# 3. Connection refused - backend not running
```

**Problem: Build fails**
```bash
# Clear node_modules and reinstall
cd /var/www/AI-HR-Onboarding/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Try building again
npm run build
```

### General Issues

**Problem: Permission denied errors**
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/AI-HR-Onboarding

# Fix permissions
sudo chmod -R 755 /var/www/AI-HR-Onboarding
sudo chmod -R 644 /var/www/AI-HR-Onboarding/backend/.env
```

**Problem: Service keeps restarting**
```bash
# Check logs for errors
sudo journalctl -u ai-hr-backend -n 100

# Check system resources
free -h
df -h

# Check for Python errors
cd /var/www/AI-HR-Onboarding/backend
source venv/bin/activate
python -c "from app.main import app; print('Import successful')"
```

---

## ✅ Post-Deployment Checklist

Before marking deployment as complete, verify:

- [ ] **Backend service is running**
  ```bash
  sudo systemctl status ai-hr-backend
  ```

- [ ] **Nginx is running**
  ```bash
  sudo systemctl status nginx
  ```

- [ ] **Frontend is accessible**
  - Open `http://YOUR_SERVER_IP` in browser
  - Should see login page or dashboard

- [ ] **Backend API is accessible**
  - Open `http://YOUR_SERVER_IP:8000/docs` or `http://YOUR_SERVER_IP/api/docs`
  - Should see Swagger UI

- [ ] **Database connection works**
  - Check backend logs for database connection success
  - Try creating a test employee or HR account

- [ ] **Environment variables are set correctly**
  - Verify all keys in `backend/.env` are production keys (not personal keys)
  - Verify `frontend/.env` has correct API URL

- [ ] **Email accounts configured**
  - Log into HR Dashboard
  - Add email accounts for sending onboarding emails

- [ ] **IT accounts can be created**
  - Test IT account creation functionality
  - Verify passwords are encrypted

- [ ] **File uploads work**
  - Test document upload functionality
  - Verify files are stored in correct location

- [ ] **Firewall is configured**
  ```bash
  sudo ufw status
  ```

- [ ] **SSL/HTTPS is configured** (if using domain)
  - Verify SSL certificate is valid
  - Test HTTPS redirect

- [ ] **Backup strategy is in place**
  - Database backups scheduled
  - Environment files backed up securely

---

## 📞 Additional Resources

- **Backend README**: See `backend/README.md` for backend-specific documentation
- **Frontend README**: See `frontend/README.md` for frontend-specific documentation
- **Deployment Keys Checklist**: See `DEPLOYMENT_KEYS_CHECKLIST.md` for key replacement guide
- **API Documentation**: Available at `http://YOUR_SERVER_IP:8000/docs` after deployment

---

## 🚨 Security Reminders

1. **Never commit `.env` files** - They contain sensitive information
2. **Change all default passwords** - Use strong, unique passwords
3. **Keep software updated** - Regularly update system packages
4. **Use HTTPS in production** - Set up SSL certificates
5. **Restrict database access** - Only allow connections from localhost
6. **Use firewall** - Block unnecessary ports
7. **Regular backups** - Back up database and important files
8. **Monitor logs** - Regularly check application and system logs

---

## 📝 Notes

- Replace all `YOUR_SERVER_IP` or `YOUR_SERVER_IP_OR_DOMAIN` with your actual server IP address or domain name
- Replace all `your_secure_password_here` with actual secure passwords
- This guide assumes Ubuntu/Debian Linux. Adjust commands for other distributions as needed
- For production, consider using a process manager like Gunicorn with multiple workers instead of uvicorn directly

---

**Deployment completed successfully! 🎉**

If you encounter any issues not covered in this guide, check the troubleshooting section or review the application logs.
