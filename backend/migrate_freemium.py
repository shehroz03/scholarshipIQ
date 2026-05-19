import sys
sys.path.insert(0, '.')
from app.db.session import engine
from app.db.models import Base
Base.metadata.create_all(bind=engine)
print("DB migration done! All tables created/updated.")
