import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.core.config import settings

print(f"ADMIN_USERNAME: {settings.ADMIN_USERNAME}")
print(f"ADMIN_PASSWORD: {settings.ADMIN_PASSWORD}")
print(f"SECRET_KEY: {settings.SECRET_KEY}")
