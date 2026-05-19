import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.core.security import verify_password

# Test password from .env
password_to_test = "password123"
is_valid = verify_password(password_to_test, settings.ADMIN_PASSWORD_HASH)

print(f"Testing password: {password_to_test}")
print(f"Hash in settings: {settings.ADMIN_PASSWORD_HASH}")
print(f"Verification result: {is_valid}")

# Try direct verification with a new hash
from passlib.context import CryptContext
ctx = CryptContext(schemes=["pbkdf2_sha256"])
new_hash = ctx.hash(password_to_test)
print(f"New direct hash: {new_hash}")
print(f"Verification of direct hash: {ctx.verify(password_to_test, new_hash)}")
print(f"Verification of direct hash using security.verify_password: {verify_password(password_to_test, new_hash)}")
