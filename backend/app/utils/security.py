from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from cryptography.fernet import Fernet
import os
import base64

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get or generate encryption key for IT credentials
def get_encryption_key():
    """Get or create encryption key for IT passwords"""
    encryption_key = os.getenv("IT_ENCRYPTION_KEY")
    
    if not encryption_key:
        # Generate a key if not set (should be set in production)
        encryption_key = Fernet.generate_key().decode()
        print("⚠️ WARNING: IT_ENCRYPTION_KEY not set. Using generated key. Set this in .env for production!")
        print("⚠️ NOTE: This generated key will change on each restart. Set a fixed key in .env!")
    
    # Strip whitespace (in case .env has spaces)
    if isinstance(encryption_key, str):
        encryption_key = encryption_key.strip()
    
    # Validate and return key in correct format
    try:
        # Fernet keys are base64-encoded bytes, so we need to encode the string
        key_bytes = encryption_key.encode() if isinstance(encryption_key, str) else encryption_key
        
        # Try to create a Fernet instance to validate the key format
        Fernet(key_bytes)
        return key_bytes
    except Exception as e:
        error_msg = (
            f"❌ Invalid IT_ENCRYPTION_KEY format: {str(e)}. "
            "The key must be a valid Fernet key (32 url-safe base64-encoded bytes). "
            "Generate a new key using: python generate_key.py"
        )
        print(error_msg)
        raise ValueError(error_msg)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def encrypt_password(password: str) -> str:
    """Encrypt password for storage using Fernet (symmetric encryption)"""
    if not password:
        return None
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        encrypted = fernet.encrypt(password.encode())
        return encrypted.decode()
    except Exception as e:
        print(f"❌ Error encrypting password: {e}")
        raise ValueError(f"Failed to encrypt password: {str(e)}")

def decrypt_password(encrypted_password: str) -> str:
    """Decrypt password for retrieval using Fernet"""
    if not encrypted_password:
        return None
    try:
        key = get_encryption_key()
        fernet = Fernet(key)
        decrypted = fernet.decrypt(encrypted_password.encode())
        return decrypted.decode()
    except Exception as e:
        error_msg = (
            f"Failed to decrypt password. "
            f"Error: {str(e)}. "
            f"This usually happens when IT_ENCRYPTION_KEY is not set in .env or has changed. "
            f"SOLUTION: Set IT_ENCRYPTION_KEY in your .env file. "
            f"If accounts were already added, you'll need to delete and re-add them with the correct key."
        )
        print(f"❌ {error_msg}")
        raise ValueError(error_msg)
