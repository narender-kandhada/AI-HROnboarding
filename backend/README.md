# AI HR Onboarding Backend

A comprehensive FastAPI backend for an AI-driven HR onboarding system that automates employee onboarding, manages HR workflows, and provides intelligent chatbot assistance.

## 🚀 Features

- **Employee Onboarding Management** - Complete workflow from pre-onboarding to joining day
- **AI-Powered Chatbot (SUPA)** - Intelligent assistant for employees and HR
- **Document Management** - Upload, validate, and store employee documents (PDF only)
- **IT Account Management** - Create and manage company email accounts for employees
- **Email Account Management** - Configure multiple email accounts for sending onboarding emails
- **Training Module Tracking** - Track training completion and certifications
- **Feedback System** - Collect and analyze employee feedback
- **HR Dashboard APIs** - Analytics, employee tracking, and reporting
- **Authentication & Authorization** - JWT-based auth with HR department verification
- **Password Reset** - Secure password reset for HR users

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py             # Settings and environment variables
│   ├── database.py           # SQLAlchemy database setup
│   ├── models.py             # Database models (Employee, Task, ITAccount, etc.)
│   ├── schemas.py            # Pydantic schemas for validation
│   ├── dependencies.py       # FastAPI dependencies (auth, DB sessions)
│   ├── chat_api.py           # Chatbot API endpoints
│   │
│   ├── routes/               # API route handlers
│   │   ├── auth.py           # Authentication (HR login, password reset)
│   │   ├── employee.py       # Employee CRUD operations
│   │   ├── preonboarding.py  # Pre-onboarding workflow
│   │   ├── training.py       # Training module management
│   │   ├── feedback.py       # Feedback collection
│   │   ├── documents.py      # Document management
│   │   ├── tasks.py          # Task management
│   │   ├── hr.py             # HR-specific endpoints
│   │   ├── it_accounts.py    # IT account management
│   │   ├── email_accounts.py # Email account configuration
│   │   └── chatbot.py        # Chatbot endpoints
│   │
│   ├── mcp_tools/            # AI and business logic tools
│   │   ├── task_tracker.py   # Employee and onboarding analytics
│   │   ├── chatbot_engine.py # Gemini AI integration
│   │   ├── grounding.py      # Policy and context retrieval
│   │   ├── intent.py         # Query intent detection
│   │   ├── prompt_builder.py # Prompt construction for AI
│   │   └── ...
│   │
│   ├── utils/                 # Utility functions
│   │   ├── security.py       # Password hashing, encryption (Fernet)
│   │   ├── token.py          # JWT token generation
│   │   ├── email.py          # Email sending (Hostinger SMTP/IMAP)
│   │   └── document_parser.py # Document handling
│   │
│   ├── assets/               # Static assets
│   │   ├── NDA Form.pdf      # NDA template
│   │   └── policies/         # Company policy documents
│   │
│   └── uploads/              # Employee document storage
│
├── migrations/               # Database migration scripts
├── scripts/                 # Utility scripts
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## 🛠️ Setup

### Prerequisites

- Python 3.8 or higher
- MySQL database (or SQLite for development)
- Hostinger email account (for email sending)
- Google Gemini API key (for AI chatbot)

### Installation

1. **Clone the repository** (if applicable)

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Create a virtual environment** (recommended)
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**
   
   Create a `.env` file in the `backend/` directory (or copy from `env.example`):
   ```env
   # Database
   DATABASE_URL=mysql+pymysql://user:password@localhost:3306/ai_hr_db
   # or for SQLite: sqlite:///./novabot.db
   
   # Security (CRITICAL - Generate new keys for production)
   SECRET_KEY=your-secret-key-here
   IT_ENCRYPTION_KEY=your-fernet-encryption-key
   
   # AI
   OPENAI_API_KEY=your-openai-key  # Optional
   GEMINI_API_KEY=your-gemini-api-key
   
   # Email (Hostinger - hardcoded in code, update if using different provider)
   # HOSTINGER_SMTP_SERVER=smtp.hostinger.com
   # HOSTINGER_SMTP_PORT=587
   # HOSTINGER_IMAP_SERVER=imap.hostinger.com
   # HOSTINGER_IMAP_PORT=993
   ```

   **Generate keys:**
   ```bash
   # Generate all keys at once (recommended)
   python generate_all_keys.py
   
   # Or generate individually
   python generate_key.py  # For IT_ENCRYPTION_KEY
   python -c "import secrets; print(secrets.token_urlsafe(32))"  # For SECRET_KEY
   ```
   
   **⚠️ Important for Deployment:**
   - Before deploying, replace ALL personal keys with organization keys
   - See [../DEPLOYMENT_KEYS_CHECKLIST.md](../DEPLOYMENT_KEYS_CHECKLIST.md) for complete guide
   - Never commit `.env` files to version control

6. **Run database migrations** (if needed)
   ```bash
   # The app will create tables automatically on startup
   # For manual migrations, see migrations/ folder
   ```

7. **Start the development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`

8. **Access API documentation**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

## 🔑 Key Dependencies

- **FastAPI** (0.118.0) - Modern web framework
- **SQLAlchemy** (2.0.39) - ORM
- **PyMySQL** (1.1.2) - MySQL driver
- **python-jose** (3.5.0) - JWT authentication
- **passlib** (1.7.4) - Password hashing (bcrypt)
- **cryptography** (46.0.2) - Encryption for sensitive data
- **google-generativeai** (0.8.5) - Gemini AI integration
- **requests** (2.32.3) - HTTP client for Ollama/local LLM
- **pydantic** (2.12.0) - Data validation
- **python-dotenv** (1.1.1) - Environment variable management

## 📡 Main API Endpoints

### Authentication
- `POST /auth/hr_login_post` - HR login (uses IT accounts)
- `POST /auth/reset-password` - Reset HR password

### Employee Management
- `GET /employees` - List all employees
- `POST /employees` - Create new employee
- `GET /employees/{id}` - Get employee details
- `PUT /employees/{id}` - Update employee
- `POST /employees/{id}/personal-info` - Submit personal details

### Documents
- `POST /employees/{id}/documents` - Upload documents (PDF only)
- `GET /employees/{id}/documents` - Get employee documents

### Training
- `POST /training/{employee_id}` - Submit training certificates
- `GET /training/{employee_id}` - Get training status

### IT Accounts
- `POST /it-accounts` - Create IT account
- `GET /it-accounts` - List all IT accounts
- `GET /it-accounts/employee/{employee_id}` - Get employee IT account
- `PUT /it-accounts/{account_id}` - Update IT account
- `DELETE /it-accounts/{account_id}` - Delete IT account

### Email Accounts
- `POST /email-accounts` - Add email account
- `GET /email-accounts` - List email accounts
- `GET /email-accounts/default` - Get default email account
- `PUT /email-accounts/{id}/set-default` - Set default email
- `DELETE /email-accounts/{id}` - Delete email account

### Chatbot (SUPA)
- `POST /chatbot/chat` - Send message to AI chatbot

### Pre-Onboarding
- `POST /preonboarding/send-email` - Send onboarding email

See `POSTMAN_API_GUIDE.md` for detailed API documentation.

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **Encryption**: Fernet encryption for sensitive data (IT passwords)
- **JWT Tokens**: Secure token-based authentication
- **Department Verification**: Only HR department employees can access HR routes
- **Input Validation**: Pydantic schemas for all API inputs
- **File Validation**: PDF-only document uploads with format validation

## 🧪 Testing

### Manual Testing
Use the Swagger UI at `/docs` for interactive API testing.

### Postman
Import the collection from `POSTMAN_API_GUIDE.md` for comprehensive testing.

## 📚 Additional Documentation

- `POSTMAN_API_GUIDE.md` - Complete API reference
- `IT_ACCOUNT_SETUP.md` - IT account management guide
- `EMAIL_ACCOUNT_SETUP.md` - Email configuration guide
- `DEPENDENCIES.md` - Dependency overview
- `CLEANUP_GUIDE.md` - Code cleanup reference
- **[../DEPLOYMENT_KEYS_CHECKLIST.md](../DEPLOYMENT_KEYS_CHECKLIST.md)** - 🔑 **Complete deployment keys guide**
- **[../KEYS_REPLACEMENT_SUMMARY.md](../KEYS_REPLACEMENT_SUMMARY.md)** - Quick keys reference
- **[../KEYS_REPLACEMENT_TABLE.md](../KEYS_REPLACEMENT_TABLE.md)** - Keys in table format

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env`
- Ensure MySQL server is running
- Check database credentials

### Email Sending Issues
- Verify Hostinger SMTP/IMAP credentials
- Check `IT_ENCRYPTION_KEY` is set correctly
- Ensure email account is configured in HR Dashboard

### Authentication Errors
- Verify `SECRET_KEY` is set in `.env`
- Check employee department is set to "HR"
- Ensure IT account exists for HR employee

### Encryption Errors
- Run `python generate_key.py` to generate `IT_ENCRYPTION_KEY`
- Or use `python generate_all_keys.py` to generate all keys
- Ensure no extra spaces/quotes in `.env` file
- ⚠️ **CRITICAL**: If `IT_ENCRYPTION_KEY` changes, all encrypted passwords become unreadable

### Deployment Issues
- Ensure all personal keys are replaced (see [DEPLOYMENT_KEYS_CHECKLIST.md](../DEPLOYMENT_KEYS_CHECKLIST.md))
- Verify `DATABASE_URL` points to production database
- Check all API keys are organization keys, not personal keys
- Ensure `IT_ENCRYPTION_KEY` matches the key used to encrypt existing passwords

## 🤝 Contributing

1. Follow existing code structure
2. Add proper error handling
3. Update API documentation
4. Test all endpoints

## 📄 License

MIT License

## 👥 Authors

Sumeru Digitals HR Team
