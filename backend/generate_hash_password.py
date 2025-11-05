#!/usr/bin/env python3
"""
Script to generate bcrypt hashed passwords manually.

This script uses the same password hashing method as the AI HR Onboarding System.
Useful for:
- Creating hashed passwords for IT accounts
- Testing password hashing
- Manual password generation
"""

from passlib.context import CryptContext
import getpass
import sys

# Use the same password context as the system
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def main():
    """Main function to generate hashed password"""
    print("=" * 60)
    print("🔐 Password Hash Generator")
    print("AI HR Onboarding System - Manual Password Hash Generator")
    print("=" * 60)
    print()
    
    # Get password from user
    if len(sys.argv) > 1:
        # Password provided as command line argument
        password = sys.argv[1]
        print(f"📝 Password provided via command line argument")
    else:
        # Prompt for password (hidden input)
        password = getpass.getpass("Enter password to hash: ")
        if not password:
            print("❌ Error: Password cannot be empty!")
            sys.exit(1)
    
    print()
    
    # Generate hash
    print("⏳ Generating hash...")
    hashed = hash_password(password)
    
    print()
    print("=" * 60)
    print("✅ Password Hash Generated Successfully!")
    print("=" * 60)
    print()
    print("Original Password:", "*" * len(password))
    print("Hashed Password: ", hashed)
    print()
    
    # Verify the hash
    print("🔍 Verifying hash...")
    is_valid = verify_password(password, hashed)
    if is_valid:
        print("✅ Hash verification successful!")
    else:
        print("❌ Hash verification failed!")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("📋 Usage Instructions:")
    print("=" * 60)
    print()
    print("1. Copy the hashed password above")
    print("2. Use it in your database or system")
    print("3. The system can verify passwords using verify_password()")
    print()
    print("💡 Example usage:")
    print("   python generate_hash_password.py")
    print("   python generate_hash_password.py 'your_password_here'")
    print()
    print("⚠️  Security Note:")
    print("   - Never share your hashed passwords")
    print("   - Store hashed passwords securely")
    print("   - Use this script only in secure environments")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)

