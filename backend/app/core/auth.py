"""Authentication utilities (JWT)."""
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    # bcrypt 限制 72 字节，超长截断
    truncated = password.encode()[:72].decode(errors="ignore")
    return pwd_context.hash(truncated)


def verify_password(plain: str, hashed: str) -> bool:
    truncated = plain.encode()[:72].decode(errors="ignore")
    return pwd_context.verify(truncated, hashed)


def create_token(user_id: int, username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "username": username, "exp": expire},
        settings.secret_key,
    )


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract user from Bearer token. Returns dict with user_id and username."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录")
    try:
        payload = decode_token(credentials.credentials)
        return {"user_id": int(payload["sub"]), "username": payload["username"]}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token无效")


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict | None:
    """Same as get_current_user but returns None instead of raising."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return {"user_id": int(payload["sub"]), "username": payload["username"]}
    except JWTError:
        return None
