import os
import base64
from pathlib import Path
from typing import Optional, Tuple
from loguru import logger
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

class CryptoService:
    """
    Symmetric cryptographic service using AES-256-GCM.
    Derives key from user master password via PBKDF2-HMAC-SHA256.
    Stores the derived key in-memory during application session.
    """
    def __init__(self):
        self._session_key: Optional[bytes] = None
        self._salt_length = 16
        self._nonce_length = 12

    def is_unlocked(self) -> bool:
        """Check if the session key is initialized."""
        return self._session_key is not None

    def lock(self) -> None:
        """Clear the transient session key from memory."""
        self._session_key = None
        logger.info("Application locked. Session key cleared.")

    def unlock(self, password: str, salt: bytes) -> None:
        """Derive key from password and salt, storing it in memory."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        self._session_key = kdf.derive(password.encode())
        logger.info("Application unlocked successfully.")

    def encrypt_string(self, plaintext: str) -> str:
        """Encrypt string value using active session key and return base64 string."""
        if not self._session_key:
            raise ValueError("Application is locked. Master password required.")
        
        aesgcm = AESGCM(self._session_key)
        nonce = os.urandom(self._nonce_length)
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
        
        # Combine nonce and ciphertext
        combined = nonce + ciphertext
        return base64.b64encode(combined).decode("utf-8")

    def decrypt_string(self, encrypted_b64: str) -> str:
        """Decrypt base64 string using active session key and return plaintext."""
        if not self._session_key:
            raise ValueError("Application is locked. Master password required.")
        
        try:
            combined = base64.b64decode(encrypted_b64)
            if len(combined) < self._nonce_length:
                raise ValueError("Invalid cipher size")
            
            nonce = combined[:self._nonce_length]
            ciphertext = combined[self._nonce_length:]
            
            aesgcm = AESGCM(self._session_key)
            decrypted = aesgcm.decrypt(nonce, ciphertext, None)
            return decrypted.decode("utf-8")
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Decryption failed. Invalid key or corrupted data.") from e

    def encrypt_bytes(self, data: bytes) -> bytes:
        """Encrypt raw bytes using active session key."""
        if not self._session_key:
            raise ValueError("Application is locked. Master password required.")
        
        aesgcm = AESGCM(self._session_key)
        nonce = os.urandom(self._nonce_length)
        ciphertext = aesgcm.encrypt(nonce, data, None)
        return nonce + ciphertext

    def decrypt_bytes(self, encrypted_data: bytes) -> bytes:
        """Decrypt raw bytes using active session key."""
        if not self._session_key:
            raise ValueError("Application is locked. Master password required.")
        
        if len(encrypted_data) < self._nonce_length:
            raise ValueError("Invalid cipher size")
        
        nonce = encrypted_data[:self._nonce_length]
        ciphertext = encrypted_data[self._nonce_length:]
        
        aesgcm = AESGCM(self._session_key)
        return aesgcm.decrypt(nonce, ciphertext, None)

    def generate_salt(self) -> bytes:
        """Generate a cryptographically secure random salt."""
        return os.urandom(self._salt_length)

    def secure_read_bytes(self, file_path: str | os.PathLike) -> bytes:
        """Read bytes from disk, decrypting if encrypted with the magic prefix."""
        path = Path(file_path) if isinstance(file_path, (str, os.PathLike)) else file_path
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
            
        with open(path, "rb") as f:
            data = f.read()
            
        magic = b"777C8_ENC"
        if data.startswith(magic):
            if not self.is_unlocked():
                raise ValueError("Application is locked. Master password required to access encrypted files.")
            encrypted_data = data[len(magic):]
            return self.decrypt_bytes(encrypted_data)
        return data

    def secure_write_bytes(self, file_path: str | os.PathLike, data: bytes, encrypt: bool = False) -> None:
        """Write bytes to disk, encrypting if encrypt is True."""
        path = Path(file_path) if isinstance(file_path, (str, os.PathLike)) else file_path
        if encrypt:
            if not self.is_unlocked():
                raise ValueError("Application is locked. Master password required to write encrypted files.")
            encrypted_data = self.encrypt_bytes(data)
            data_to_write = b"777C8_ENC" + encrypted_data
        else:
            data_to_write = data
            
        with open(path, "wb") as f:
            f.write(data_to_write)

# Singleton instance
crypto_service = CryptoService()
