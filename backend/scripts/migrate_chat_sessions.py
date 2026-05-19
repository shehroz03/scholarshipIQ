import sys
import os
sys.path.append(
  os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
  )
)

from app.db.session import engine
from app.db.models import Base
from app.db import models  # ensure all models imported

def migrate():
    Base.metadata.create_all(bind=engine)
    print("All tables created/verified")
    
    # Verify tables exist
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables: {tables}")
    
    if 'chat_sessions' in tables:
        print("chat_sessions table exists")
    else:
        print("chat_sessions MISSING")
        
    if 'chat_messages' in tables:
        print("chat_messages table exists")
    else:
        print("chat_messages MISSING")

if __name__ == "__main__":
    migrate()
