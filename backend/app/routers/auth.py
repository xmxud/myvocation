"""Authentication routes."""
from fastapi import APIRouter, Depends
from app.database import get_db, query, query_one
from app.models import success, error
from app.models.user import UserCreate, UserLogin
from app.services.auth import register_user, login_user
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register")
async def register(body: UserCreate):
    db = await get_db()
    try:
        result = await register_user(db, body.username, body.display_name, body.password)
        return success(result, "注册成功")
    except ValueError as e:
        return error(str(e), 400)
    finally:
        await db.close()


@router.post("/login")
async def login(body: UserLogin):
    db = await get_db()
    try:
        result = await login_user(db, body.username, body.password)
        return success(result, "登录成功")
    except ValueError as e:
        return error(str(e), 401)
    finally:
        await db.close()


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    """获取当前登录用户信息"""
    db = await get_db()
    try:
        row = await query_one(
            db,
            "SELECT id, username, display_name, role, created_at FROM users WHERE id = ?",
            (user["user_id"],),
        )
        if not row:
            return error("用户不存在", 404)
        return success(dict(row))
    finally:
        await db.close()


@router.get("/users")
async def list_users(user: dict = Depends(get_current_user)):
    """获取用户列表（管理员用）"""
    db = await get_db()
    try:
        rows = await query(
            db,
            "SELECT id, username, display_name, role FROM users ORDER BY id"
        )
        return success(rows)
    finally:
        await db.close()
