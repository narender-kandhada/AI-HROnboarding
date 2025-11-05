# IT Account Management Setup Guide

## Overview
This feature allows HR to securely store and manage IT account credentials (company email, passwords, VPN, Slack, Jira) for employees after manual IT setup.

## 🔐 Security Features
- **Encryption**: All passwords are encrypted using Fernet symmetric encryption
- **HR-only Access**: Only authenticated HR users can view/create/edit accounts
- **Secure Storage**: Passwords are never stored in plain text
- **Audit Trail**: Timestamps track when accounts are created/updated/completed

## 🚀 Setup Instructions

### 1. Generate Encryption Key
```bash
cd backend
python generate_key.py
```

This will output an `IT_ENCRYPTION_KEY` that you need to add to your `.env` file:
```
IT_ENCRYPTION_KEY=your_generated_key_here
```

### 2. Install Dependencies
```bash
pip install cryptography
# or if using requirements.txt:
pip install -r requirements.txt
```

### 3. Database Migration
The system will automatically create the `it_accounts` table on startup. If it doesn't:
```python
from app.database import engine, Base
from app.models import ITAccount
Base.metadata.create_all(bind=engine)
```

## 📋 API Endpoints

### GET `/it-accounts/`
- Get all IT accounts (HR only)
- Returns: List of all employee IT accounts

### GET `/it-accounts/employee/{employee_id}`
- Get specific employee's IT account
- Returns: IT account details (without passwords)

### GET `/it-accounts/employee/{employee_id}/password`
- Get decrypted passwords for an employee
- Returns: Company email, company password, VPN password

### POST `/it-accounts/`
- Create new IT account
- Body: `ITAccountCreate` schema
- Returns: Success message with account ID

### PUT `/it-accounts/employee/{employee_id}`
- Update existing IT account
- Body: `ITAccountUpdate` schema
- Returns: Success message

### DELETE `/it-accounts/employee/{employee_id}`
- Delete IT account
- Returns: Success message

## 🎨 Frontend Usage

### HR Dashboard → IT Accounts
Access via: HR Dashboard → 💻 IT Accounts

### Features Available:
1. **View All**: See list of all employees with their IT account status
2. **Create Account**: Click "Create Account" for employees without IT accounts
3. **View Passwords**: Click 👁️ to view encrypted passwords
4. **Edit Account**: Click ✏️ to update account details
5. **Status Tracking**: Track email, VPN, and Slack setup status

### Form Fields:
- **Company Email**: Official company email address
- **Company Password**: Will be encrypted
- **Slack Username**: Slack handle
- **Jira Username**: Jira handle  
- **VPN Username**: VPN username
- **VPN Password**: Will be encrypted
- **Setup Status**: pending/completed/failed for each account type
- **Notes**: Additional setup information

## 🔄 Workflow

1. **IT Team**: Manually sets up accounts (email, VPN, etc.)
2. **HR Team**: Accesses IT Account Management page
3. **HR Creates**: Records company email and passwords
4. **HR Updates**: Marks setup status as "completed" when done
5. **Employee**: Receives credentials through secure channel
6. **HR Can View**: Retrieve decrypted passwords when needed

## ⚠️ Important Security Notes

1. **Key Management**: Never commit `IT_ENCRYPTION_KEY` to version control
2. **Backup**: Keep a secure backup of your encryption key
3. **Access Control**: Only authorized HR personnel should have access
4. **Audit**: Regularly review who has access to IT accounts
5. **Rotation**: Consider rotating encryption keys periodically

## 🧪 Testing

```bash
# Test encryption/decryption
python -c "from app.utils.security import encrypt_password, decrypt_password; \
    encrypted = encrypt_password('test123'); \
    print(f'Encrypted: {encrypted}'); \
    print(f'Decrypted: {decrypt_password(encrypted)}')"

# Expected output: test123
```

## 📊 Data Model

```sql
CREATE TABLE it_accounts (
    id INTEGER PRIMARY KEY,
    employee_id INTEGER UNIQUE NOT NULL,
    company_email VARCHAR(255),
    company_password TEXT, -- Encrypted
    slack_username VARCHAR(100),
    jira_username VARCHAR(100),
    vpn_username VARCHAR(100),
    vpn_password TEXT, -- Encrypted
    email_setup VARCHAR(50) DEFAULT 'pending',
    vpn_setup VARCHAR(50) DEFAULT 'pending',
    slack_setup VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME,
    updated_at DATETIME,
    setup_completed_at DATETIME,
    setup_notes TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

## 🐛 Troubleshooting

### "Invalid encryption key"
- Regenerate key using `generate_key.py`
- Add to `.env` file
- Restart backend

### "Failed to decrypt password"
- Check if `IT_ENCRYPTION_KEY` is set correctly
- Ensure key matches the one used for encryption
- If lost, you'll need to re-enter passwords

### "Unauthorized" errors
- Ensure you're logged in as HR
- Check that `Authorization: Bearer <token>` header is included
- Re-login to HR dashboard

## 📝 Future Enhancements

- [ ] Password expiration reminders
- [ ] Audit log of who accessed passwords
- [ ] Integration with IT ticket systems
- [ ] Automated account provisioning
- [ ] Password reset workflows
- [ ] Multi-factor authentication for password viewing
