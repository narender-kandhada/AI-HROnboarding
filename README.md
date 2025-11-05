# AI HR Onboarding System

A comprehensive, AI-powered HR onboarding platform that automates the entire employee onboarding process from pre-onboarding to joining day, featuring an intelligent chatbot, document management, training tracking, and comprehensive HR analytics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.118.0-teal.svg)

## 🎯 Overview

The AI HR Onboarding System streamlines the employee onboarding process through automation, intelligent assistance, and comprehensive tracking. It includes:

- **Complete Onboarding Workflow** - From pre-onboarding to joining day
- **AI Chatbot (SUPA)** - Intelligent assistant for employees and HR
- **Document Management** - Secure PDF upload and validation
- **Training Tracking** - Monitor training completion and certifications
- **HR Dashboard** - Analytics, reporting, and employee management
- **IT Account Management** - Automated IT account creation and management
- **Email Integration** - Hostinger email integration for onboarding emails

## ✨ Key Features

### For Employees
- 📋 **Onboarding Dashboard** - Track progress, tasks, and completion status
- 🤖 **AI Chatbot (SUPA)** - Get instant answers about policies, procedures, and onboarding
- 📄 **Document Upload** - Submit Aadhaar, PAN, Bank details, and NDA (PDF only)
- 🎓 **Training Module** - Complete POSH, IT Access, and Collaboration training
- 💬 **Feedback System** - Share onboarding experience and suggestions
- 📊 **Progress Tracking** - Real-time progress indicators and task completion

### For HR
- 📈 **Analytics Dashboard** - Comprehensive onboarding statistics and insights
- 👥 **Employee Management** - Track all employees, their status, and onboarding progress
- 📋 **Employee Details Page** - Comprehensive employee data management with document viewing
- 📄 **Document Management** - View, download, and print employee documents (PDF files)
- 🔄 **Employee Status Control** - Enable/disable employee accounts with one-click toggle
- 📧 **Email Management** - Configure multiple email accounts for sending onboarding emails
- 💻 **IT Account Management** - Create and manage IT accounts for employees
- 📤 **Data Export** - Export comprehensive employee data to Excel with all details
- 🔍 **Advanced Search** - Multi-field search by name, email, company email, mobile, Aadhaar, PAN, department, or role
- 🎯 **Smart Filtering** - Filter by department and role with automatic normalization
- 📝 **Department Analytics** - Department-wise onboarding statistics

### Technical Features
- 🔐 **Secure Authentication** - JWT-based auth with HR department verification
- 🔒 **Password Security** - Bcrypt hashing and Fernet encryption
- 📧 **Email Integration** - Hostinger SMTP/IMAP with Sent folder sync
- 🤖 **AI Integration** - Google Gemini AI + local LLM (Ollama) support
- 💾 **Database** - MySQL/SQLite support with SQLAlchemy ORM
- 🎨 **Modern UI** - React with Tailwind CSS and Framer Motion animations
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🏗️ Architecture

```
AI-HR-Onboarding/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application
│   │   ├── models.py       # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── mcp_tools/      # AI and business logic
│   │   └── utils/          # Utilities (email, security, etc.)
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node dependencies
│   └── README.md           # Frontend documentation
│
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- **Backend**: Python 3.8+, MySQL (or SQLite)
- **Frontend**: Node.js 16+, npm
- **Additional**: Hostinger email account, Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-HR-Onboarding
   ```

2. **Set up Backend**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```
   
   Create `.env` file (or copy from `backend/env.example`):
   ```env
   DATABASE_URL=mysql+pymysql://user:password@localhost:3306/ai_hr_db
   SECRET_KEY=your-secret-key
   IT_ENCRYPTION_KEY=your-fernet-key  # Run: python generate_key.py
   GEMINI_API_KEY=your-gemini-key
   OPENAI_API_KEY=your-openai-key  # Optional
   ```
   
   **Generate keys:**
   ```bash
   # Generate all keys at once
   python generate_all_keys.py
   
   # Or generate individually
   python generate_key.py  # For IT_ENCRYPTION_KEY
   python -c "import secrets; print(secrets.token_urlsafe(32))"  # For SECRET_KEY
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   ```
   
   Create `.env` file (or copy from `frontend/env.example`):
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the application**
   
   **Terminal 1 (Backend):**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
   
   **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## 📖 Documentation

- **[Backend README](backend/README.md)** - Backend setup, API endpoints, and architecture
- **[Frontend README](frontend/README.md)** - Frontend setup, components, and features
- **[Postman API Guide](backend/POSTMAN_API_GUIDE.md)** - Complete API reference
- **[Dependencies Guide](DEPENDENCIES.md)** - Dependency overview and installation
- **[IT Account Setup](backend/IT_ACCOUNT_SETUP.md)** - IT account management guide
- **[Email Account Setup](backend/EMAIL_ACCOUNT_SETUP.md)** - Email configuration guide
- **[Deployment Keys Checklist](DEPLOYMENT_KEYS_CHECKLIST.md)** - 🔑 **Complete guide for replacing personal keys before deployment**
- **[Keys Replacement Summary](KEYS_REPLACEMENT_SUMMARY.md)** - Quick reference for deployment keys
- **[Keys Replacement Table](KEYS_REPLACEMENT_TABLE.md)** - Table format of all keys to replace

## 🛠️ Tech Stack

### Backend
- **FastAPI** (0.118.0) - Modern Python web framework
- **SQLAlchemy** (2.0.39) - ORM for database operations
- **PyMySQL** (1.1.2) - MySQL database driver
- **python-jose** (3.5.0) - JWT authentication
- **passlib** (1.7.4) - Password hashing
- **cryptography** (46.0.2) - Encryption for sensitive data
- **google-generativeai** (0.8.5) - Gemini AI integration
- **Pydantic** (2.12.0) - Data validation

### Frontend
- **React** (18.3.1) - UI framework
- **Vite** (5.2.0) - Build tool
- **React Router** (6.30.1) - Routing
- **Tailwind CSS** (3.4.18) - Styling
- **Framer Motion** (11.18.2) - Animations
- **Axios** (1.7.0) - HTTP client
- **Recharts** (3.3.0) - Data visualization

## 🎯 Key Features in Detail

### Employee Details Management
- **Comprehensive Employee View**: View all employee information in a detailed table
- **Document Access**: View, download, and print employee documents (Aadhaar, PAN, Bank, NDA)
- **Status Management**: Toggle employee status between active and disabled with one click
- **Advanced Search**: Search across multiple fields (name, email, company email, mobile, Aadhaar, PAN, department, role)
- **Smart Filtering**: Filter by department and role with automatic normalization (handles variations like "HR" vs "hr")
- **Excel Export**: Export comprehensive employee data including personal info, family details, and documents
- **Sticky Columns**: Emp ID and Name columns remain visible while scrolling horizontally
- **Real-time Updates**: Employee status changes reflect immediately in the UI

### AI Chatbot (SUPA)
- **Multi-model Support**: Uses local LLM (Ollama) with fallback
- **Context Awareness**: Retrieves relevant policies, employee data, and onboarding context
- **Intent Detection**: Understands employee vs HR queries
- **Policy Grounding**: Retrieves relevant company policies
- **HR Analytics**: Provides insights on onboarding metrics

### Document Management
- **PDF Validation**: Only PDF files accepted
- **Format Validation**: Aadhaar (12 digits), PAN (XXXXX1234X format)
- **Automatic Replacement**: Re-uploading replaces existing files
- **Secure Storage**: Employee-specific folders with UUID naming
- **Document Viewing**: HR can view employee documents in browser
- **Document Download**: Download employee documents for offline access
- **Document Printing**: Print employee documents directly from the system
- **File Management**: List and manage all employee documents from Employee Details page

### Email Integration
- **Hostinger SMTP/IMAP**: Professional email sending
- **Multiple Accounts**: Support for multiple sending accounts
- **Sent Folder Sync**: Automatically saves sent emails to Sent folder
- **Default Account**: Configurable default email for sending

### Security
- **Password Hashing**: Bcrypt for secure password storage
- **Encryption**: Fernet encryption for sensitive IT account passwords
- **JWT Tokens**: Secure token-based authentication
- **Department Verification**: Only HR department can access HR routes
- **Input Validation**: Pydantic schemas validate all inputs
- **Employee Status Control**: Disabled employees cannot access the system
- **Account Management**: HR can enable/disable employee accounts to control access

## 📊 API Endpoints Overview

### Authentication
- `POST /auth/hr_login_post` - HR login
- `POST /auth/reset-password` - Password reset

### Employee Management
- `GET /employees` - List employees
- `POST /employees` - Create employee
- `GET /employees/{id}` - Get employee details
- `PUT /employees/{id}/status` - Update employee status (enable/disable) - HR only
- `POST /employees/{id}/personal-info` - Submit personal details

### Documents & Training
- `POST /employees/{id}/documents` - Upload documents
- `GET /documents/employee/{employee_id}/files` - Get list of employee files - HR only
- `GET /documents/employee/{employee_id}/file/{filename}` - View/download employee document - HR only
- `POST /training/{employee_id}` - Submit training certificates

### HR Features
- `GET /hr/onboarding_status` - Onboarding status
- `GET /it-accounts` - List IT accounts
- `POST /email-accounts` - Add email account

### Chatbot
- `POST /chatbot/chat` - Send message to SUPA

See [Postman API Guide](backend/POSTMAN_API_GUIDE.md) for complete reference.

## 🔒 Security Best Practices

1. **Environment Variables**: 
   - Never commit `.env` files (they're in `.gitignore`)
   - Use example files (`env.example`) as templates
   - Store production keys securely (use secrets management service)
2. **Key Management**: 
   - Generate unique keys for each environment (dev/staging/prod)
   - Use `python backend/generate_all_keys.py` to generate keys
   - **CRITICAL**: If `IT_ENCRYPTION_KEY` changes, all encrypted passwords must be re-encrypted
3. **Deployment Keys**: 
   - Replace ALL personal keys before deployment (see [DEPLOYMENT_KEYS_CHECKLIST.md](DEPLOYMENT_KEYS_CHECKLIST.md))
   - Never reuse keys across environments
   - Rotate keys regularly
4. **Password Policy**: Enforce strong passwords (min 6 characters)
5. **HTTPS**: Use HTTPS in production
6. **Token Expiration**: Implement token refresh mechanism
7. **Input Validation**: Validate all user inputs
8. **File Validation**: Restrict file types and sizes

## 🧪 Testing

### Backend Testing
- Use Swagger UI at `/docs` for interactive testing
- Import Postman collection from `POSTMAN_API_GUIDE.md`

### Frontend Testing
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test responsive design on different screen sizes
- Verify API integration

## 🚢 Deployment

### ⚠️ Important: Replace Personal Keys Before Deployment

**Before deploying, you MUST replace all personal keys with organization keys. See:**
- **[DEPLOYMENT_KEYS_CHECKLIST.md](DEPLOYMENT_KEYS_CHECKLIST.md)** - Complete deployment guide
- **[KEYS_REPLACEMENT_SUMMARY.md](KEYS_REPLACEMENT_SUMMARY.md)** - Quick reference
- **[KEYS_REPLACEMENT_TABLE.md](KEYS_REPLACEMENT_TABLE.md)** - Table format

### Backend Deployment
1. **Replace all keys** (see deployment keys checklist)
   - Generate new `SECRET_KEY` and `IT_ENCRYPTION_KEY`
   - Update `DATABASE_URL` with production database
   - Replace API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`)
2. Set up production database (MySQL recommended)
3. Configure environment variables in `backend/.env`
4. Install dependencies: `pip install -r requirements.txt`
5. Run with production server: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend Deployment
1. **Update `VITE_API_URL`** in `frontend/.env` to production API URL
2. Build production bundle: `npm run build`
3. Deploy `dist/` folder to web server
4. Configure reverse proxy to backend API
5. Ensure `VITE_API_URL` points to production backend

### Key Generation Scripts
- **Generate all keys**: `python backend/generate_all_keys.py`
- **Generate encryption key**: `python backend/generate_key.py`
- **Generate secret key**: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 👥 Authors

**Sumeru Digitals**
- Backend Team
- Frontend Team
- HR Team

## 🙏 Acknowledgments

- FastAPI team for the excellent framework
- React team for the powerful UI library
- Tailwind CSS for the utility-first CSS framework
- All open-source contributors

## 📞 Support

For issues, questions, or contributions:
- Check documentation in respective README files
- Review API documentation in Postman guide
- Contact development team

---

**Built with ❤️ by Sumeru Digitals**

