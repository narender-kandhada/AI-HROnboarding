# 🔐 Deployment Keys Checklist

This document lists all personal keys, secrets, and credentials used in the project that **must be replaced** with organization keys before deployment.

---

## 📋 Table of Contents
1. [Backend Environment Variables](#backend-environment-variables)
2. [Frontend Environment Variables](#frontend-environment-variables)
3. [Database Configuration](#database-configuration)
4. [Email Service Configuration](#email-service-configuration)
5. [API Keys](#api-keys)
6. [Security Keys](#security-keys)
7. [Hardcoded Values to Review](#hardcoded-values-to-review)

---

## 🔧 Backend Environment Variables

These variables are configured in `backend/.env` file (create if it doesn't exist):

### 1. **DATABASE_URL**
- **Location**: `backend/app/config.py`, `backend/app/database.py`
- **Purpose**: Database connection string
- **Current Format**: `sqlite:///./novabot.db` (development) or `mysql+pymysql://user:password@localhost:3306/ai_hr_db`
- **Required for Production**: ✅ Yes
- **Action**: Replace with organization's database connection string
- **Example**: `mysql+pymysql://org_user:org_password@org_db_host:3306/org_database_name`

### 2. **SECRET_KEY**
- **Location**: `backend/app/utils/security.py`, `backend/app/utils/token.py`
- **Purpose**: JWT token signing key for authentication
- **Current Value**: Personal secret key (from your `.env`)
- **Required for Production**: ✅ Yes - **CRITICAL**
- **Action**: Generate a new secure secret key for organization
- **How to Generate**: 
  ```python
  import secrets
  print(secrets.token_urlsafe(32))
  ```
- **Security Note**: This key must be kept secret. If compromised, all JWT tokens must be regenerated.

### 3. **IT_ENCRYPTION_KEY**
- **Location**: `backend/app/utils/security.py`
- **Purpose**: Fernet encryption key for encrypting IT account passwords and email account passwords
- **Current Value**: Personal encryption key (from your `.env`)
- **Required for Production**: ✅ Yes - **CRITICAL**
- **Action**: Generate a new encryption key using `python backend/generate_key.py`
- **Security Note**: 
  - ⚠️ **IMPORTANT**: If this key changes, all encrypted passwords in the database will become unreadable
  - You must use the same key that was used to encrypt existing data, OR re-encrypt all passwords with the new key
  - Generate once and keep it secure - losing this key means losing access to encrypted data

### 4. **OPENAI_API_KEY**
- **Location**: `backend/app/config.py`
- **Purpose**: OpenAI API key (optional, for AI chatbot features)
- **Current Value**: Personal OpenAI API key
- **Required for Production**: ⚠️ Optional (if using OpenAI)
- **Action**: Replace with organization's OpenAI API key if using OpenAI, or remove if using Gemini only

### 5. **GEMINI_API_KEY**
- **Location**: `backend/app/config.py`, `backend/app/mcp_tools/chatbot_engine.py`
- **Purpose**: Google Gemini API key for AI chatbot
- **Current Value**: Personal Gemini API key
- **Required for Production**: ✅ Yes (if using Gemini)
- **Action**: Replace with organization's Google Gemini API key
- **How to Get**: Create API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 6. **HOSTINGER_SMTP_SERVER** (Optional)
- **Location**: `backend/app/utils/email.py` (hardcoded as `smtp.hostinger.com`)
- **Purpose**: SMTP server for sending emails
- **Current Value**: `smtp.hostinger.com` (hardcoded)
- **Required for Production**: ⚠️ Only if using Hostinger email service
- **Action**: If organization uses different email provider, update hardcoded value in `backend/app/utils/email.py`:
  - Line 17: `HOSTINGER_SMTP_SERVER`
  - Line 18: `HOSTINGER_SMTP_PORT`
  - Line 21: `HOSTINGER_IMAP_SERVER`
  - Line 22: `HOSTINGER_IMAP_PORT`

---

## 🎨 Frontend Environment Variables

These variables are configured in `frontend/.env` file (create if it doesn't exist):

### 1. **VITE_API_URL**
- **Location**: All frontend files (used via `import.meta.env.VITE_API_URL`)
- **Files Using It**:
  - `frontend/src/App.jsx`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/pages/PersonalDetails.jsx`
  - `frontend/src/pages/PreOnboarding.jsx`
  - `frontend/src/pages/HrDashboard.jsx`
  - `frontend/src/pages/EmployeeDetails.jsx`
  - `frontend/src/pages/TrackOnboarding.jsx`
  - `frontend/src/pages/ITAccountManagement.jsx`
  - `frontend/src/utils/taskfetchers.js`
  - `frontend/src/components/UploadDocs.jsx`
- **Purpose**: Backend API base URL
- **Current Value**: `http://localhost:8000` (fallback)
- **Required for Production**: ✅ Yes
- **Action**: Replace with organization's production API URL
- **Example**: `https://api.yourcompany.com` or `https://hr-api.yourcompany.com`

---

## 🗄️ Database Configuration

### Database Credentials
- **Location**: `DATABASE_URL` environment variable
- **Contains**: 
  - Database username
  - Database password
  - Database host
  - Database name
- **Action**: Replace all database credentials with organization's production database credentials

### Database File (SQLite - Development Only)
- **Location**: `backend/novabot.db`
- **Purpose**: SQLite database file (development)
- **Action**: 
  - If using SQLite in production, ensure the file is in a secure location
  - **Recommendation**: Use MySQL/PostgreSQL for production instead

---

## 📧 Email Service Configuration

### Email Account Credentials (Stored in Database)
- **Location**: `EmailAccount` model in database
- **Purpose**: Email accounts used to send onboarding emails and IT credentials
- **Encryption**: Passwords are encrypted using `IT_ENCRYPTION_KEY`
- **Action**: 
  - Organization must add their email accounts via HR Dashboard
  - Existing email accounts in database should be removed or updated
  - Ensure `IT_ENCRYPTION_KEY` matches the key used to encrypt existing passwords

### Email Server Settings (Hardcoded)
- **Location**: `backend/app/utils/email.py` (lines 17-22)
- **Current Values**:
  ```python
  HOSTINGER_SMTP_SERVER = "smtp.hostinger.com"
  HOSTINGER_SMTP_PORT = 465
  HOSTINGER_IMAP_SERVER = "imap.hostinger.com"
  HOSTINGER_IMAP_PORT = 993
  ```
- **Action**: 
  - If organization uses Hostinger, no changes needed
  - If organization uses different email provider (Gmail, Outlook, etc.), update these values

---

## 🔑 API Keys

### 1. Google Gemini API Key
- **Environment Variable**: `GEMINI_API_KEY`
- **Location**: `backend/app/config.py`, `backend/app/mcp_tools/chatbot_engine.py`
- **Current Value**: Personal Gemini API key
- **Action**: Replace with organization's Gemini API key

### 2. OpenAI API Key (Optional)
- **Environment Variable**: `OPENAI_API_KEY`
- **Location**: `backend/app/config.py`
- **Current Value**: Personal OpenAI API key
- **Action**: Replace with organization's OpenAI API key (if used), or remove from config

---

## 🔒 Security Keys

### 1. JWT Secret Key
- **Environment Variable**: `SECRET_KEY`
- **Location**: 
  - `backend/app/utils/security.py` (line 8)
  - `backend/app/utils/token.py` (line 8)
- **Purpose**: Signing JWT tokens for HR authentication
- **Current Value**: Personal secret key
- **Action**: Generate new secret key for organization
- **Security Impact**: Changing this will invalidate all existing HR login sessions

### 2. Encryption Key for IT/Email Passwords
- **Environment Variable**: `IT_ENCRYPTION_KEY`
- **Location**: `backend/app/utils/security.py` (line 16)
- **Purpose**: Encrypts IT account passwords and email account passwords
- **Current Value**: Personal encryption key
- **Action**: 
  - **Option A**: Generate new key and re-encrypt all existing passwords
  - **Option B**: Use organization's existing key (if migrating from another system)
- **Security Impact**: 
  - ⚠️ **CRITICAL**: Must use the same key that encrypted existing data, OR re-encrypt all passwords
  - Losing this key = losing access to all encrypted passwords

---

## 📝 Hardcoded Values to Review

### 1. Email Server Configuration
- **File**: `backend/app/utils/email.py`
- **Lines**: 17-22
- **Values**: SMTP/IMAP server addresses and ports
- **Action**: Update if organization doesn't use Hostinger

### 2. Default Database URL
- **File**: `backend/app/config.py`
- **Line**: 6
- **Value**: `sqlite:///./novabot.db`
- **Action**: Ensure production uses `DATABASE_URL` from `.env` (not the default)

### 3. API URL Fallbacks
- **Files**: All frontend files
- **Value**: `http://localhost:8000`
- **Action**: Ensure production uses `VITE_API_URL` from `.env` (fallback is fine for development)

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] **Backend `.env` file created** with all required variables
- [ ] **Frontend `.env` file created** with `VITE_API_URL`
- [ ] **DATABASE_URL** updated with production database credentials
- [ ] **SECRET_KEY** generated and set (new key for organization)
- [ ] **IT_ENCRYPTION_KEY** generated and set (or use existing if migrating)
- [ ] **GEMINI_API_KEY** replaced with organization's key
- [ ] **OPENAI_API_KEY** replaced or removed (if not used)
- [ ] **VITE_API_URL** set to production backend URL
- [ ] **Email server settings** updated (if not using Hostinger)
- [ ] **Email accounts** added via HR Dashboard with organization's email accounts
- [ ] **Database migrations** run on production database
- [ ] **All existing encrypted passwords** re-encrypted if `IT_ENCRYPTION_KEY` changed
- [ ] **Database backup** created before migration
- [ ] **Test all features** after deployment with new keys

---

## 🚨 Security Notes

1. **Never commit `.env` files to version control** - They should be in `.gitignore`
2. **Rotate keys regularly** - Especially `SECRET_KEY` and `IT_ENCRYPTION_KEY`
3. **Use different keys for development and production**
4. **Store production keys securely** - Use a secrets management service (AWS Secrets Manager, Azure Key Vault, etc.)
5. **Limit API key permissions** - Only grant necessary permissions to API keys
6. **Monitor API usage** - Set up alerts for unusual API key usage
7. **Backup encryption keys** - Store `IT_ENCRYPTION_KEY` securely - losing it means losing access to encrypted data

---

## 📞 Support

If you need help with any of these configurations, refer to:
- `backend/README.md` - Backend setup guide
- `backend/EMAIL_ACCOUNT_SETUP.md` - Email configuration guide
- `backend/IT_ACCOUNT_SETUP.md` - IT account management guide

---

## 📄 Summary of Files to Update

### Backend Files:
1. `backend/.env` (create this file) - All environment variables
2. `backend/app/utils/email.py` - Email server settings (if not using Hostinger)

### Frontend Files:
1. `frontend/.env` (create this file) - `VITE_API_URL`

### Database:
1. Email accounts table - Add organization's email accounts
2. IT accounts table - May need password re-encryption if key changed

---

**Last Updated**: Generated automatically
**Version**: 1.0

