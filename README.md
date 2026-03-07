# AI HR Onboarding System

A comprehensive, AI-powered HR onboarding platform that automates the entire employee onboarding process from pre-onboarding to joining day, featuring an intelligent chatbot (SUPA), document management, training tracking, and HR analytics.

## Overview

The system streamlines employee onboarding through automation, intelligent assistance, and comprehensive tracking:

- **Complete Onboarding Workflow** — Pre-onboarding to joining day
- **AI Chatbot (SUPA)** — Intelligent assistant for employees and HR
- **Document Management** — Secure PDF upload and validation
- **Training Tracking** — Monitor training completion and certifications
- **HR Dashboard** — Analytics, reporting, and employee management
- **IT Account Management** — Company email account creation and management
- **Email Integration** — Gmail SMTP integration for onboarding emails

## Architecture

```
AI-HR-Onboarding/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application & HR login
│   │   ├── models.py       # SQLAlchemy database models
│   │   ├── database.py     # Database connection setup
│   │   ├── dependencies.py # Auth dependencies
│   │   ├── routes/         # API endpoint handlers
│   │   ├── mcp_tools/      # AI chatbot logic & business tools
│   │   └── utils/          # Email, security, token utilities
│   ├── scripts/            # Utility scripts (seeding, backfill)
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main app with routing
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable UI components
│   │   ├── utils/          # API config, task fetchers
│   │   └── config/         # Training module config
│   ├── package.json        # Node dependencies
│   └── README.md           # Frontend documentation
│
└── README.md               # This file
```

## Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.118.0 | Web framework |
| SQLAlchemy | 2.0.39 | ORM |
| PyMySQL | 1.1.2 | MySQL driver |
| python-jose | 3.5.0 | JWT authentication |
| passlib | 1.7.4 | Password hashing (bcrypt) |
| google-generativeai | 0.8.5 | Gemini AI chatbot |
| Pydantic | 2.12.0 | Data validation |
| python-dotenv | 1.1.1 | Environment config |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.2.0 | Build tool |
| React Router | 6.30.1 | Routing |
| Tailwind CSS | 3.4.18 | Styling |
| Framer Motion | 11.18.2 | Animations |
| Axios | 1.7.0 | HTTP client |
| Recharts | 3.3.0 | Data visualization |

## Quick Start

### Prerequisites
- Python 3.8+, MySQL (or SQLite for dev)
- Node.js 16+, npm
- Google Gemini API key

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/onboarding_db
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-key

# Gmail SMTP (for sending onboarding emails)
GMAIL_SMTP_SERVER=smtp.gmail.com
GMAIL_SMTP_PORT=587
```

Generate `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Start backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

Start frontend:
```bash
npm run dev
```

### 3. Access
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs (Swagger): `http://localhost:8000/docs`

## Features

### For Employees
- Onboarding dashboard with progress tracking
- AI Chatbot (SUPA) for instant answers about policies and procedures
- PDF document upload (Aadhaar, PAN, Bank details, NDA)
- Training modules (POSH, IT Access, Collaboration) with certificate upload
- Joining day checklist
- Department introduction
- Feedback submission
- Final review

### For HR
- Analytics dashboard with department-wise statistics
- Employee management with advanced search and filtering
- Document viewing, downloading, and printing
- Employee status control (enable/disable)
- Pre-onboarding form to create new employees and send invitation emails
- IT account creation and management
- Email account configuration (multiple accounts, set default)
- Password reset
- Excel export of employee data

### Onboarding Flow

```
HR Creates Employee → Email Sent → Employee Opens Link → Dashboard
    ↓                                                        ↓
Pre-Onboarding                              Personal Details & Documents
                                                         ↓
                                                   Joining Day Checklist
                                                         ↓
                                                   Training Modules
                                                         ↓
                                                Department Introduction
                                                         ↓
                                                      Feedback
                                                         ↓
                                                   Final Review
                                                         ↓
                                                HR Reviews & Approves
```

## API Endpoints

### Authentication
- `POST /auth/hr_login_post` — HR login (JWT)
- `POST /auth/reset-password` — Password reset
- `GET /auth/me` — Current user info

### Employee Management
- `GET /employees` — List employees
- `POST /employees` — Create employee
- `GET /employees/{id}` — Get employee details
- `PUT /employees/{id}/status` — Toggle employee status
- `POST /employees/{id}/personal-info` — Submit personal details

### Documents & Training
- `POST /employees/{id}/documents` — Upload documents (PDF)
- `GET /documents/employee/{id}/files` — List employee files
- `GET /documents/employee/{id}/file/{filename}` — View/download file
- `POST /training/{employee_id}` — Submit training certificates
- `GET /training/{employee_id}` — Get training status

### IT & Email Accounts
- `POST /it-accounts` — Create IT account
- `GET /it-accounts` — List all IT accounts
- `PUT /it-accounts/employee/{id}` — Update IT account
- `POST /email-accounts` — Add email account
- `GET /email-accounts` — List email accounts
- `POST /email-accounts/{id}/set-default` — Set default

### HR & Analytics
- `GET /hr/onboarding_status` — Onboarding analytics

### Chatbot
- `POST /chatbot/chat` — Chat with SUPA

## Deployment

### Linux Server Deployment

#### 1. Server Requirements
- Ubuntu 20.04+, 2GB RAM, 2 CPU cores, 20GB storage
- Python 3.8+, Node.js 16+, MySQL, Nginx

#### 2. Database Setup
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE onboarding_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON onboarding_db.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. Backend
```bash
cd /var/www/AI-HR-Onboarding/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create .env with production values
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Create systemd service `/etc/systemd/system/ai-hr-backend.service`:
```ini
[Unit]
Description=AI HR Onboarding Backend
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/AI-HR-Onboarding/backend
Environment="PATH=/var/www/AI-HR-Onboarding/backend/venv/bin"
ExecStart=/var/www/AI-HR-Onboarding/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ai-hr-backend
sudo systemctl start ai-hr-backend
```

#### 4. Frontend
```bash
cd /var/www/AI-HR-Onboarding/frontend
npm install
# Set VITE_API_URL in .env to production URL (https://...)
npm run build
```

#### 5. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/AI-HR-Onboarding/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 6. SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Cloud Platform Deployment

| Platform | Free Tier | Backend URL Format |
|----------|-----------|-------------------|
| Render | Yes (512MB, cold starts) | `https://app-name.onrender.com` |
| Railway | $5/month credit | `https://app-name.up.railway.app` |
| Fly.io | 3 VMs free | `https://app-name.fly.dev` |

For any platform:
1. Set environment variables (DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, ALLOWED_ORIGINS)
2. Build command: `pip install -r backend/requirements.txt`
3. Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### GitHub Pages (Frontend Only)
1. Go to repo Settings → Pages → Source: GitHub Actions
2. Add `VITE_API_URL` as repository secret
3. Push to main branch — auto-deploys via GitHub Actions
4. Ensure backend uses HTTPS (mixed content is blocked by browsers)

### Important: CORS
Update `ALLOWED_ORIGINS` in backend `.env` or `main.py` to include your frontend domain:
```python
allowed_origins = [
    "http://localhost:5173",
    "https://your-frontend-domain.com",
]
```

### Important: HTTPS
When frontend is on HTTPS, the backend API **must** also be HTTPS. Update `VITE_API_URL` accordingly.

## Security

- **JWT Authentication** — Token-based auth with HR department verification
- **Password Hashing** — bcrypt via passlib
- **Input Validation** — Pydantic schemas on all API inputs
- **File Validation** — PDF-only uploads, 10MB size limit
- **Employee Access Control** — Disabled employees can't access the system
- **CORS** — Configurable allowed origins
- **Environment Variables** — Sensitive config kept in `.env` (gitignored)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check `.env` values, verify MySQL is running, check port 8000 is free |
| Database connection error | Verify `DATABASE_URL` format, test MySQL login manually |
| Frontend blank page | Run `npm run build`, check Nginx config, verify `dist/` exists |
| CORS errors | Add frontend domain to `allowed_origins` in backend |
| Mixed content blocked | Ensure both frontend and backend use HTTPS in production |
| Login fails | Verify IT account exists, employee department is "HR" |
| Email sending fails | Check email account is configured in HR dashboard |
| Document upload fails | Ensure file is PDF and under 10MB |

## User Guide

### HR Login
1. Open the HR login page
2. Enter company email (IT account email) and password
3. Only employees with department = "HR" can access

### Pre-Onboarding (Create Employee)
1. HR Dashboard → Pre-Onboarding
2. Fill: Employee ID, Name, Email, Department, Role
3. Submit → Employee record created, folder generated, onboarding email sent

### Employee Onboarding
1. Employee receives email with unique onboarding link
2. Opens dashboard → completes tasks in any order:
   - Personal Details & Document Upload
   - Joining Day Checklist (email setup, orientation, policy acceptance)
   - Training Modules (POSH, IT Access, Collaboration + certificate upload)
   - Department Introduction
   - Feedback
3. Final Review (available after all tasks complete) → Onboarding done

### IT Account Management
1. HR Dashboard → IT Account Management
2. Create: Select employee, enter company email & password
3. Password is hashed (bcrypt) for login, plaintext stored for email sharing

### Email Account Management
1. HR Dashboard → Email Account Setup
2. Add Gmail accounts with app passwords
3. Set one as default for sending onboarding emails

## License

MIT License

## Authors

**Sumeru Digitals**

