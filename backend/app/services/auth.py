"""Auth service."""
from app.database import query_one, execute
from app.core.auth import hash_password, verify_password, create_token


async def register_user(db, username: str, display_name: str, password: str) -> dict:
    existing = await query_one(db, "SELECT id FROM users WHERE username = ?", (username,))
    if existing:
        raise ValueError("用户名已存在")
    hashed = hash_password(password)
    last_id, _ = await execute(
        db,
        "INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)",
        (username, display_name, hashed),
    )
    user = await query_one(db, "SELECT id, username, display_name, role FROM users WHERE id = ?", (last_id,))
    token = create_token(user["id"], user["username"])
    return {"access_token": token, "user": user}


async def login_user(db, username: str, password: str) -> dict:
    user = await query_one(db, "SELECT * FROM users WHERE username = ?", (username,))
    if not user or not verify_password(password, user["password_hash"]):
        raise ValueError("用户名或密码错误")
    token = create_token(user["id"], user["username"])
    return {
        "access_token": token,
        "user": {"id": user["id"], "username": user["username"], "display_name": user["display_name"], "role": user["role"]},
    }
