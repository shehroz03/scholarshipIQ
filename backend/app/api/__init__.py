from .auth import router as auth_router
from .users import router as users_router
from .scholarships import router as scholarships_router
from .recommendations import router as recommendations_router
from .chatbot import router as chatbot_router

# The router objects themselves are usually imported in main.py
# but sometimes it's cleaner to expose them here.
