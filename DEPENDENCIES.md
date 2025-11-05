# Project Dependencies

## 📦 Backend Dependencies

The backend uses Python with FastAPI. All dependencies are listed in `backend/requirements.txt`.

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Key Dependencies
- **FastAPI** (0.118.0) - Web framework
- **SQLAlchemy** (2.0.39) - ORM
- **PyMySQL** (1.1.2) - MySQL driver
- **python-jose** (3.5.0) - JWT tokens
- **passlib** (1.7.4) - Password hashing
- **cryptography** (46.0.2) - Encryption
- **google-generativeai** (0.8.5) - Gemini AI
- **requests** (2.32.3) - HTTP client

### Removed Dependencies
- ❌ **openai** - Not used in codebase
- ❌ **sendgrid** - Not used in codebase

---

## 📦 Frontend Dependencies

The frontend uses React with Vite. All dependencies are listed in `frontend/package.json`.

### Installation
```bash
cd frontend
npm install
```

If you encounter peer dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### Key Dependencies
- **React** (^18.3.1) - UI framework
- **React Router** (^6.30.1) - Routing
- **Axios** (^1.7.0) - HTTP client
- **Framer Motion** (^11.18.2) - Animations
- **Recharts** (^3.3.0) - Charts
- **Tailwind CSS** (^3.4.18) - Styling
- **Vite** (^5.2.0) - Build tool

### Development Tools
- **@vitejs/plugin-react** - Vite React plugin
- **PostCSS** & **Autoprefixer** - CSS processing

---

## 🔍 Verification

### Backend
Check installed packages:
```bash
pip list | Select-String -Pattern "fastapi|uvicorn|sqlalchemy"
```

### Frontend
Check installed packages:
```bash
npm list --depth=0
```

---

## 📝 Notes

- **Backend**: Python 3.8+ required
- **Frontend**: Node.js 16+ recommended
- Both requirements files have been updated with actual installed versions
- Standard library modules don't need to be listed (os, json, datetime, etc.)

