# app/core/encryption.py
"""
AES-256-GCM Encryption Service for High-Security Profiles.

This service provides field-level encryption for sensitive financial data
in High-Security profiles using:
- PBKDF2 for key derivation from user password + profile salt
- AES-256-GCM for authenticated encryption

Security Features:
- 256-bit encryption keys derived from user password
- Profile-specific salts prevent cross-profile key reuse
- GCM mode provides authentication and integrity
- Random IVs for each encryption operation
"""
import os
import base64
import hashlib
import secrets
from typing import Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import logging

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Encryption service for High-Security profiles.

    Uses AES-256-GCM with PBKDF2 key derivation.

    Key derivation: PBKDF2(user_password + profile_salt, iterations=100000)
    Encryption: AES-256-GCM with random 12-byte IV

    Format: base64(IV + ciphertext + auth_tag)
    """

    # PBKDF2 iterations - 100,000 as per requirements
    PBKDF2_ITERATIONS = 100_000

    # Key size for AES-256
    KEY_SIZE = 32  # 256 bits

    # IV size for GCM mode
    IV_SIZE = 12  # 96 bits recommended for GCM

    # Salt size
    SALT_SIZE = 32  # 256 bits

    def __init__(self):
        """Initialize encryption service."""
        self._key_cache: dict[str, bytes] = {}

    @staticmethod
    def generate_salt() -> str:
        """
        Generate a random salt for a new High-Security profile.

        Returns:
            str: Base64-encoded 32-byte salt
        """
        salt = secrets.token_bytes(EncryptionService.SALT_SIZE)
        return base64.b64encode(salt).decode('utf-8')

    def derive_key(
        self,
        password: str,
        salt: str,
        use_cache: bool = True
    ) -> bytes:
        """
        Derive encryption key from password and salt using PBKDF2.

        Args:
            password: User's password
            salt: Base64-encoded profile salt
            use_cache: Whether to use cached key

        Returns:
            bytes: 256-bit encryption key
        """
        # Create cache key
        cache_key = hashlib.sha256(
            (password + salt).encode('utf-8')
        ).hexdigest()

        # Check cache
        if use_cache and cache_key in self._key_cache:
            return self._key_cache[cache_key]

        # Decode salt
        salt_bytes = base64.b64decode(salt)

        # Derive key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=self.KEY_SIZE,
            salt=salt_bytes,
            iterations=self.PBKDF2_ITERATIONS,
            backend=default_backend()
        )

        key = kdf.derive(password.encode('utf-8'))

        # Cache the key
        if use_cache:
            self._key_cache[cache_key] = key

        return key

    def encrypt(
        self,
        plaintext: str,
        password: str,
        salt: str
    ) -> str:
        """
        Encrypt plaintext using AES-256-GCM.

        Args:
            plaintext: Text to encrypt
            password: User's password for key derivation
            salt: Base64-encoded profile salt

        Returns:
            str: Base64-encoded ciphertext (IV + ciphertext + tag)
        """
        if not plaintext:
            return ""

        # Derive key
        key = self.derive_key(password, salt)

        # Generate random IV
        iv = os.urandom(self.IV_SIZE)

        # Create cipher
        aesgcm = AESGCM(key)

        # Encrypt (GCM automatically appends auth tag)
        ciphertext = aesgcm.encrypt(
            iv,
            plaintext.encode('utf-8'),
            None  # No additional authenticated data
        )

        # Combine IV + ciphertext (includes tag)
        encrypted = iv + ciphertext

        # Return as base64
        return base64.b64encode(encrypted).decode('utf-8')

    def decrypt(
        self,
        ciphertext: str,
        password: str,
        salt: str
    ) -> str:
        """
        Decrypt ciphertext using AES-256-GCM.

        Args:
            ciphertext: Base64-encoded ciphertext
            password: User's password for key derivation
            salt: Base64-encoded profile salt

        Returns:
            str: Decrypted plaintext

        Raises:
            ValueError: If decryption fails (wrong password or tampered data)
        """
        if not ciphertext:
            return ""

        try:
            # Derive key
            key = self.derive_key(password, salt)

            # Decode from base64
            encrypted = base64.b64decode(ciphertext)

            # Extract IV and ciphertext
            iv = encrypted[:self.IV_SIZE]
            ct = encrypted[self.IV_SIZE:]

            # Create cipher
            aesgcm = AESGCM(key)

            # Decrypt (GCM automatically verifies auth tag)
            plaintext = aesgcm.decrypt(iv, ct, None)

            return plaintext.decode('utf-8')

        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Decryption failed - invalid key or tampered data")

    def encrypt_numeric(
        self,
        value: float,
        password: str,
        salt: str
    ) -> str:
        """
        Encrypt a numeric value (e.g., transaction amount).

        Args:
            value: Numeric value to encrypt
            password: User's password
            salt: Profile salt

        Returns:
            str: Base64-encoded encrypted value
        """
        return self.encrypt(str(value), password, salt)

    def decrypt_numeric(
        self,
        ciphertext: str,
        password: str,
        salt: str
    ) -> float:
        """
        Decrypt an encrypted numeric value.

        Args:
            ciphertext: Base64-encoded ciphertext
            password: User's password
            salt: Profile salt

        Returns:
            float: Decrypted numeric value
        """
        plaintext = self.decrypt(ciphertext, password, salt)
        return float(plaintext)

    def clear_cache(self, cache_key: Optional[str] = None):
        """
        Clear key cache.

        Args:
            cache_key: Specific key to clear, or None to clear all
        """
        if cache_key:
            self._key_cache.pop(cache_key, None)
        else:
            self._key_cache.clear()

    def verify_password(
        self,
        password: str,
        salt: str,
        test_ciphertext: str,
        expected_plaintext: str
    ) -> bool:
        """
        Verify if password can decrypt test data correctly.

        Useful for validating password before full decryption.

        Args:
            password: Password to test
            salt: Profile salt
            test_ciphertext: Known encrypted value
            expected_plaintext: Expected decrypted value

        Returns:
            bool: True if password is correct
        """
        try:
            decrypted = self.decrypt(test_ciphertext, password, salt)
            return decrypted == expected_plaintext
        except ValueError:
            return False


# Global encryption service instance
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """
    Get the global encryption service instance.

    Returns:
        EncryptionService: Singleton encryption service
    """
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service


class ProfileEncryptionContext:
    """
    Context manager for working with encrypted profile data.

    Usage:
        async with ProfileEncryptionContext(profile, password) as ctx:
            decrypted_amount = ctx.decrypt(encrypted_amount)
            new_encrypted = ctx.encrypt(new_value)
    """

    def __init__(
        self,
        profile_id: str,
        salt: str,
        password: str,
        encryption_service: Optional[EncryptionService] = None
    ):
        """
        Initialize encryption context for a profile.

        Args:
            profile_id: Profile UUID
            salt: Profile encryption salt
            password: User password for key derivation
            encryption_service: Optional custom encryption service
        """
        self.profile_id = profile_id
        self.salt = salt
        self.password = password
        self.service = encryption_service or get_encryption_service()

    def encrypt(self, plaintext: str) -> str:
        """Encrypt text with profile's key."""
        return self.service.encrypt(plaintext, self.password, self.salt)

    def decrypt(self, ciphertext: str) -> str:
        """Decrypt text with profile's key."""
        return self.service.decrypt(ciphertext, self.password, self.salt)

    def encrypt_numeric(self, value: float) -> str:
        """Encrypt numeric value."""
        return self.service.encrypt_numeric(value, self.password, self.salt)

    def decrypt_numeric(self, ciphertext: str) -> float:
        """Decrypt numeric value."""
        return self.service.decrypt_numeric(ciphertext, self.password, self.salt)

    def __enter__(self):
        """Enter context."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - clear sensitive data."""
        # Note: In production, use secure memory clearing
        pass
