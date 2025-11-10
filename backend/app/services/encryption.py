import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from app.config import settings

def get_fernet_key():
    """Get or generate encryption key for token encryption."""
    if settings.encryption_key:
        return base64.urlsafe_b64decode(settings.encryption_key.encode())
    else:
        # Generate key from secret (for development)
        password = settings.secret_key.encode()
        salt = b'salt_'  # In production, use a proper random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(password))

def encrypt_token(token: str) -> str:
    """Encrypt a token for secure storage."""
    if not token:
        return ""
    
    key = get_fernet_key()
    f = Fernet(key)
    encrypted = f.encrypt(token.encode())
    return base64.urlsafe_b64encode(encrypted).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt a token for use."""
    if not encrypted_token:
        return ""
    
    try:
        key = get_fernet_key()
        f = Fernet(key)
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_token.encode())
        decrypted = f.decrypt(encrypted_bytes)
        return decrypted.decode()
    except Exception:
        return ""  # Token is invalid or corrupted