"""Database connection (SQLite via aiosqlite)."""
import aiosqlite
import os
from app.config import settings

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), settings.database_path)


async def get_db() -> aiosqlite.Connection:
    """Get an async SQLite database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def query(db: aiosqlite.Connection, sql: str, params: tuple = ()) -> list[dict]:
    """Execute a SELECT query and return rows as dicts."""
    cursor = await db.execute(sql, params)
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def query_one(db: aiosqlite.Connection, sql: str, params: tuple = ()) -> dict | None:
    """Execute a SELECT query and return the first row."""
    cursor = await db.execute(sql, params)
    row = await cursor.fetchone()
    return dict(row) if row else None


async def execute(db: aiosqlite.Connection, sql: str, params: tuple = ()) -> tuple[int, int]:
    """Execute an INSERT/UPDATE/DELETE and return (last_id, changes)."""
    cursor = await db.execute(sql, params)
    await db.commit()
    return cursor.lastrowid, cursor.rowcount


async def init_db():
    """Initialize database by running migrate-v2.sql."""
    db = await get_db()
    try:
        migrate_path = os.path.join(os.path.dirname(DB_PATH), "migrate-v2.sql")
        if os.path.exists(migrate_path):
            with open(migrate_path) as f:
                sql = f.read()
            await db.executescript(sql)
            await db.commit()
    finally:
        await db.close()
