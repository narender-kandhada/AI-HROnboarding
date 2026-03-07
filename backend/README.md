# AI HR Onboarding — Backend

FastAPI backend for the AI HR Onboarding system. Handles employee management, authentication, document storage, training tracking, email sending, IT account management, and AI chatbot (SUPA).

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, HR login endpoint
│   ├── config.py            # Settings and environment variables
│   ├── database.py          # SQLAlchemy engine & session setup
│   ├── models.py            # Database models (Employee, ITAccount, EmailAccount, etc.)
│   ├── schemas.py           # Pydantic validation schemas
│   ├── dependencies.py      # Auth dependencies (get_current_hr_user)
│   ├── chat_api.py          # Chatbot API router
│   │
│   ├── routes/
│   │   ├── auth.py           # Authentication (login, password reset)
│   │   ├── employee.py       # Employee CRUD
│   │   ├── preonboarding.py  # Pre-onboarding workflow
│   │   ├── training.py       # Training module management
│   │   ├── feedback.py       # Feedback collection
│   │   ├── documents.py      # Document upload/retrieval
│   │   ├── tasks.py          # Task management
│   │   ├── hr.py             # HR analytics endpoints
│   │   ├── it_accounts.py    # IT account CRUD
│   │   ├── email_accounts.py # Email account configuration
│   │   ├── module_progress.py # Module progress tracking
│   │   └── chatbot.py        # Chatbot endpoints
│   │
│   ├── mcp_tools/
│   │   ├── chatbot_engine.py # Gemini AI integration
│   │   ├── grounding.py      # Policy & context retrieval
│   │   ├── intent.py         # Query intent detection
│   │   ├── prompt_builder.py # AI prompt construction
│   │   ├── prompt_enricher.py # Prompt enrichment
│   │   ├── task_tracker.py   # Employee & onboarding analytics
│   │   ├── get_employee_status.py # Employee status queries
│   │   ├── analyze_feedback.py    # Feedback analysis
│   │   ├── schedule_meeting.py    # Meeting scheduling
│   │   └── send_reminder.py       # Reminder sending
│   │
│   ├── utils/
│   │   ├── security.py       # Password hashing (bcrypt), JWT tokens
│   │   ├── email.py          # Gmail SMTP email sending
│   │   └── (token.py)        # JWT token generation
│   │
│   ├── assets/
│   │   └── policies/         # Company policy documents
│   │
│   └── uploads/              # Employee document storage (per-employee folders)
│
├── scripts/
│   ├── seed_task_modules.py       # Seed task modules
│   ├── normalize_departments.py   # Normalize department names
│   ├── backfill_folders.py        # Backfill employee folders
│   └── sync_existing_employees.py # Sync existing employees
│
├── generate_key.py          # Generate SECRET_KEY
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## Setup

### Prerequisites
- Python 3.8+
- MySQL (or SQLite for development)
- Google Gemini API key

### Installation

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### Environment Variables

Create `.env` in the `backend/` directory:

```env
# Database
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/onboarding_db
# For SQLite (dev): sqlite:///./onboarding.db

# Security
SECRET_KEY=your-secret-key-here

# AI
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-key          # Optional

# Email (Gmail SMTP)
GMAIL_SMTP_SERVER=smtp.gmail.com
GMAIL_SMTP_PORT=587

# Frontend URL (for CORS and email links)
FRONTEND_BASE_URL=http://localhost:3001

# CORS (comma-separated, optional — defaults are set in main.py)
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173
```

Generate `SECRET_KEY`:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

Tables are created automatically on startup via SQLAlchemy.

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.118.0 | Web framework |
| uvicorn | 0.37.0 | ASGI server |
| sqlalchemy | 2.0.39 | ORM |
| pymysql | 1.1.2 | MySQL driver |
| python-jose | 3.5.0 | JWT tokens |
| passlib | 1.7.4 | Password hashing (bcrypt) |
| pydantic | 2.12.0 | Data validation |
| google-generativeai | 0.8.5 | Gemini AI |
| python-dotenv | 1.1.1 | .env file loading |
| email-validator | 2.3.0 | Email validation |
| python-multipart | 0.0.12 | File uploads |
| requests | 2.32.3 | HTTP client (Ollama/LLM) |

Full list in `requirements.txt`.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/hr_login_post` | HR login (returns JWT) |
| POST | `/auth/reset-password` | Reset HR password |
| GET | `/auth/me` | Get current user info |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | List all employees |
| POST | `/employees` | Create employee |
| GET | `/employees/{id}` | Get employee by ID |
| PUT | `/employees/{id}` | Update employee |
| PUT | `/employees/{id}/status` | Enable/disable employee |
| POST | `/employees/{id}/personal-info` | Submit personal details |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/employees/{id}/documents` | Upload documents (PDF only) |
| GET | `/documents/employee/{id}/files` | List employee files |
| GET | `/documents/employee/{id}/file/{filename}` | View/download file |

### Training
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/training/{employee_id}` | Submit training certificates |
| GET | `/training/{employee_id}` | Get training status |

### IT Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/it-accounts` | Create IT account |
| GET | `/it-accounts` | List all IT accounts |
| GET | `/it-accounts/employee/{id}` | Get employee IT account |
| GET | `/it-accounts/employee/{id}/password` | Get employee password |
| PUT | `/it-accounts/employee/{id}` | Update IT account |
| DELETE | `/it-accounts/employee/{id}` | Delete IT account |

### Email Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/email-accounts` | Add email account |
| GET | `/email-accounts` | List email accounts |
| GET | `/email-accounts/default` | Get default account |
| PUT | `/email-accounts/{id}` | Update email account |
| POST | `/email-accounts/{id}/set-default` | Set as default |
| DELETE | `/email-accounts/{id}` | Delete email account |
| GET | `/email-accounts/{id}/verify-password` | Verify password |
| GET | `/email-accounts/{id}/test` | Send test email |

### Pre-Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/preonboarding/send-email` | Send onboarding email |

### HR Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hr/onboarding_status` | Onboarding statistics |

### Chatbot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chatbot/chat` | Chat with SUPA AI |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback` | Submit feedback |
| GET | `/feedback` | Get all feedback |

## Security

- **Password Hashing**: bcrypt via passlib — used for IT account login passwords
- **JWT Tokens**: python-jose — 1-hour expiry, HS256 algorithm
- **HR Department Check**: Only employees with department="HR" can access HR routes
- **Input Validation**: Pydantic schemas on all endpoints
- **File Validation**: PDF-only uploads, validated on server
- **CORS**: Configurable allowed origins

## Utility Scripts

```bash
# Seed default task modules
python scripts/seed_task_modules.py

# Normalize department names in database
python scripts/normalize_departments.py

# Backfill employee upload folders
python scripts/backfill_folders.py

# Sync existing employees
python scripts/sync_existing_employees.py
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Database connection error | Verify `DATABASE_URL` in `.env`, ensure MySQL is running |
| Import errors | Ensure virtual env is activated, run `pip install -r requirements.txt` |
| Auth errors | Check `SECRET_KEY` is set, verify employee has department="HR" and IT account |
| Email sending fails | Check email account configured in HR dashboard, verify Gmail app password |
| Port already in use | `lsof -i :8000` to find process, kill it or change port |
| CORS errors | Add frontend domain to `ALLOWED_ORIGINS` in `.env` or `main.py` |

