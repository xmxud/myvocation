"""Dependencies for FastAPI routes."""
from fastapi import Depends
from app.database import get_db
from app.core.auth import get_current_user, get_optional_user
