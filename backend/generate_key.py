"""
Utility script to generate IT_ENCRYPTION_KEY for .env file
Run: python generate_key.py
"""
from cryptography.fernet import Fernet

def generate_encryption_key():
    """Generate a secure encryption key for IT credentials"""
    key = Fernet.generate_key()
    print("=" * 60)
    print("IT_ENCRYPTION_KEY generated!")
    print("=" * 60)
    print(f"\nAdd this to your .env file:\n")
    print(f"IT_ENCRYPTION_KEY={key.decode()}\n")
    print("=" * 60)
    print("⚠️  Keep this key secure! Do not share it.")
    print("⚠️  If you lose this key, you cannot decrypt existing passwords.")
    print("=" * 60)
    return key.decode()

if __name__ == "__main__":
    generate_encryption_key()
