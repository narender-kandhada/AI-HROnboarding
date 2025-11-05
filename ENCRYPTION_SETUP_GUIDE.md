# Email Account Encryption Setup Guide

## ✅ Encryption System is Ready!

Your email account passwords are encrypted using **Fernet symmetric encryption** - a secure, industry-standard method.

## Quick Setup Steps

### 1. Generate Encryption Key

Run this command in the `backend` directory:

```bash
cd backend
python generate_key.py
```

This will output something like:
```
IT_ENCRYPTION_KEY=gAAAAABl1234567890abcdef...
```

### 2. Add to .env File

Copy the generated key and add it to your `backend/.env` file:

```env
IT_ENCRYPTION_KEY=gAAAAABl1234567890abcdef...
```

**⚠️ IMPORTANT:** 
- Keep this key secure and private
- Never commit it to version control
- If you lose this key, you cannot decrypt existing passwords
- If you change this key, you'll need to re-add all email accounts

### 3. Restart Your Backend Server

After adding the key, restart your backend server so it picks up the new environment variable.

### 4. Add Email Accounts

Now you can add email accounts in the HR Dashboard:
1. Go to HR Dashboard → Email Account Management
2. Click "Add Email Account"
3. Enter your email and actual password
4. The password will be encrypted automatically before storage

## How It Works

1. **When Adding Email Account:**
   - You enter the actual password: `"MyPassword123"`
   - System encrypts it: `"gAAAAABl..."` (encrypted)
   - Stores encrypted version in database

2. **When Sending Emails:**
   - System retrieves encrypted password from database
   - Decrypts it back to: `"MyPassword123"`
   - Uses actual password for SMTP authentication

## Troubleshooting

### Error: "Failed to encrypt password"
**Solution:** Make sure `IT_ENCRYPTION_KEY` is set in `.env` file

### Error: "Could not decrypt password"
**Possible causes:**
1. `IT_ENCRYPTION_KEY` is not set in `.env`
2. The key has changed since accounts were created
3. The key format is incorrect

**Solution:**
- Check that `IT_ENCRYPTION_KEY` is in your `.env` file
- If you changed the key, you'll need to delete and re-add email accounts
- Verify the key format (should be a long base64 string starting with `gAAAAA`)

### Verify Password Encryption

You can verify an email account password was encrypted correctly using the API:

```bash
GET /email-accounts/{account_id}/verify-password
```

This will confirm the password can be decrypted successfully.

## Security Best Practices

✅ **DO:**
- Keep `IT_ENCRYPTION_KEY` in `.env` file (not in code)
- Use different keys for development and production
- Backup your encryption key securely
- Restart server after changing the key

❌ **DON'T:**
- Commit `.env` file to version control
- Share the encryption key publicly
- Change the key after creating accounts (without re-adding them)
- Use the same key across different environments

## Current Status

✅ Encryption system is implemented and working
✅ Error handling is improved with clear messages
✅ Password verification endpoint available
✅ Test email endpoint available

You're all set! Just generate the key, add it to `.env`, and start adding email accounts.

