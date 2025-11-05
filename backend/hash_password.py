#!/usr/bin/env python3
"""
Simple script to generate bcrypt password hash.
Quick and easy password hash generator.
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python hash_password.py <password>")
        print("Example: python hash_password.py 'mypassword123'")
        sys.exit(1)
    
    password = sys.argv[1]
    hashed = hash_password(password)
    
    print("\n" + "="*60)
    print("HASHED PASSWORD:")
    print("="*60)
    print(hashed)
    print("="*60 + "\n")
    
    # Quick verification
    if pwd_context.verify(password, hashed):
        print("✅ Hash verified successfully!")
    else:
        print("❌ Hash verification failed!")
    print()

