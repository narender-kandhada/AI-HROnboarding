# Password Hash Generation Scripts

This directory contains scripts to manually generate password hashes for the AI HR Onboarding System.

## Scripts Available

### 1. `generate_hash_password.py` (Interactive)
Full-featured script with interactive prompts and verification.

### 2. `hash_password.py` (Simple)
Quick and simple script for command-line usage.

## Usage

### Method 1: Interactive Script (Recommended)

```bash
cd backend
python generate_hash_password.py
```

When prompted, enter your password (it will be hidden for security).

**Example:**
```bash
python generate_hash_password.py
Enter password to hash: [password is hidden]
```

### Method 2: Command Line Argument

```bash
python generate_hash_password.py "your_password_here"
```

**Example:**
```bash
python generate_hash_password.py "MySecurePassword123"
```

### Method 3: Simple Script

```bash
python hash_password.py "your_password_here"
```

**Example:**
```bash
python hash_password.py "MySecurePassword123"
```

## Output

The script will output:
- The hashed password (bcrypt hash)
- Verification status
- Usage instructions

**Example Output:**
```
============================================================
✅ Password Hash Generated Successfully!
============================================================

Original Password: ************
Hashed Password:  $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5Q1Z3qF5K5K5K

✅ Hash verification successful!
```

## Use Cases

### 1. Creating IT Account Passwords

IT accounts store passwords using bcrypt hashing. Use this script to generate hashed passwords for:
- Manual database updates
- Testing IT account creation
- Bulk password generation

### 2. Testing Password Verification

Generate a hash and verify it matches the original password.

### 3. Manual Database Updates

If you need to manually update a password in the database:
1. Generate hash using this script
2. Update the database record with the hash
3. Test login with the original password

## Important Notes

⚠️ **Security Warnings:**
- Never share your hashed passwords
- Run this script only in secure environments
- Hashed passwords are one-way (cannot be reversed)
- Use strong passwords (minimum 8 characters recommended)

✅ **Password Storage:**
- The system uses bcrypt for password hashing
- Same algorithm as `backend/app/utils/security.py`
- Compatible with the system's password verification

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'passlib'"

**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

### Error: "ModuleNotFoundError: No module named 'getpass'"

**Solution:** `getpass` is part of Python standard library. This shouldn't happen unless using an unusual Python installation.

### Hash Verification Fails

**Solution:** This should never happen. If it does, there's a bug in the script. Report it.

## Technical Details

- **Algorithm:** bcrypt
- **Library:** passlib[bcrypt]
- **Salt Rounds:** Default (10-12 rounds)
- **Format:** Standard bcrypt hash format

## Examples

### Example 1: Generate Hash for IT Account

```bash
python hash_password.py "EmployeePassword123"
```

Copy the output hash and use it when creating IT accounts.

### Example 2: Generate Multiple Passwords

```bash
python hash_password.py "password1"
python hash_password.py "password2"
python hash_password.py "password3"
```

### Example 3: Interactive Mode

```bash
python generate_hash_password.py
# Enter password when prompted (hidden input)
```

## Integration with System

The generated hash can be used directly in:
- IT account creation
- Password reset functionality
- Manual database updates

The system's `verify_password()` function will correctly verify passwords against these hashes.

---

**Note:** For encrypted passwords (Fernet encryption, used for email sharing), use the system's `encrypt_password()` function, not this script. This script only generates bcrypt hashes for login passwords.

