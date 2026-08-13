"""Theme/node routes (planning_nodes)."""
from fastapi import APIRouter, Depends
from app.database import get_db, execute
from app.models import success, error
from app.models.planning import NodeCreate, NodeUpdate
from app.core.auth import get_optional_user
from app.services.planning import (
    get_children, get_node, create_node, update_node, delete_node,
    get_full_tree, get_descriptions, get_images,
)

router = APIRouter(prefix="/api", tags=["规划节点"])


@router.get("/themes")
async def list_themes(page: int = 1, size: int = 20):
    db = await get_db()
    try:
        from app.database import query
        offset = (page - 1) * size
        rows = await query(
            db,
            "SELECT * FROM planning_nodes WHERE node_type = 'THEME' ORDER BY sort_order LIMIT ? OFFSET ?",
            (size, offset),
        )
        # progress_percent 不再落库，按主题子树内执行记录的完成率现算
        for row in rows:
            stats = await query(
                db,
                """WITH RECURSIVE subtree AS (
                       SELECT id FROM planning_nodes WHERE id = ?
                       UNION ALL
                       SELECT n.id FROM planning_nodes n
                       JOIN subtree s ON n.parent_id = s.id
                     )
                     SELECT COUNT(*) AS total,
                            COALESCE(SUM(CASE WHEN is_done = 1 THEN 1 ELSE 0 END), 0) AS done
                     FROM daily_executions
                     WHERE node_id IN (SELECT id FROM subtree)""",
                (row["id"],),
            )
            total, done = stats[0]["total"], stats[0]["done"]
            row["progress_percent"] = round(done * 100 / total) if total else 0
        total = await query(db, "SELECT COUNT(*) as c FROM planning_nodes WHERE node_type='THEME'")
        return success({"themes": rows, "total": total[0]["c"], "page": page, "size": size})
    finally:
        await db.close()


@router.get("/themes/{theme_id}")
async def get_theme(theme_id: int):
    db = await get_db()
    try:
        node = await get_node(db, theme_id)
        if not node:
            return error("主题不存在", 404)
        return success(node)
    finally:
        await db.close()


@router.post("/themes")
async def create_theme(body: NodeCreate, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        data = body.model_dump()
        data["node_type"] = "THEME"
        data["parent_id"] = None
        node = await create_node(db, data, uid)
        return success(node, "主题创建成功")
    finally:
        await db.close()


@router.put("/themes/{theme_id}")
async def update_theme(theme_id: int, body: NodeUpdate):
    db = await get_db()
    try:
        node = await update_node(db, theme_id, body.model_dump())
        if not node:
            return error("主题不存在", 404)
        return success(node, "主题更新成功")
    finally:
        await db.close()


@router.delete("/themes/{theme_id}")
async def delete_theme(theme_id: int):
    db = await get_db()
    try:
        changes = await delete_node(db, theme_id)
        if changes == 0:
            return error("主题不存在", 404)
        return success({"deleted_id": theme_id}, "主题删除成功")
    finally:
        await db.close()


@router.get("/nodes/{node_id}/children")
async def list_children(node_id: int, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        children = await get_children(db, node_id, uid)
        return success(children)
    finally:
        await db.close()


@router.get("/nodes/{node_id}")
async def get_node_detail(node_id: int):
    db = await get_db()
    try:
        node = await get_node(db, node_id)
        if not node:
            return error("节点不存在", 404)
        return success(node)
    finally:
        await db.close()


@router.get("/nodes/{node_id}/full-tree")
async def get_tree(node_id: int):
    db = await get_db()
    try:
        node = await get_full_tree(db, node_id)
        if not node:
            return error("节点不存在", 404)
        return success(node)
    finally:
        await db.close()


@router.post("/nodes")
async def create_new_node(body: NodeCreate, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        node = await create_node(db, body.model_dump(), uid)
        return success(node, "节点创建成功")
    finally:
        await db.close()


@router.put("/nodes/{node_id}")
async def update_node_detail(node_id: int, body: NodeUpdate):
    db = await get_db()
    try:
        node = await update_node(db, node_id, body.model_dump())
        if not node:
            return error("节点不存在", 404)
        return success(node, "节点更新成功")
    finally:
        await db.close()


@router.delete("/nodes/{node_id}")
async def delete_node_detail(node_id: int):
    db = await get_db()
    try:
        changes = await delete_node(db, node_id)
        if changes == 0:
            return error("节点不存在", 404)
        return success({"deleted_id": node_id}, "节点删除成功")
    finally:
        await db.close()


@router.get("/nodes/{node_id}/descriptions")
async def list_descriptions(node_id: int):
    db = await get_db()
    try:
        return success(await get_descriptions(db, node_id))
    finally:
        await db.close()


@router.post("/nodes/{node_id}/descriptions")
async def add_description(node_id: int, body: dict):
    db = await get_db()
    try:
        last_id, _ = await execute(
            db,
            "INSERT INTO node_descriptions (node_id, content, order_index) VALUES (?, ?, (SELECT COUNT(*) FROM node_descriptions WHERE node_id = ?))",
            (node_id, body["content"], node_id),
        )
        from app.database import query_one
        desc = await query_one(db, "SELECT * FROM node_descriptions WHERE id = ?", (last_id,))
        return success(desc, "描述添加成功")
    finally:
        await db.close()


@router.delete("/nodes/{node_id}/descriptions/{desc_id}")
async def delete_description(node_id: int, desc_id: int):
    db = await get_db()
    try:
        await execute(db, "DELETE FROM node_descriptions WHERE id = ? AND node_id = ?", (desc_id, node_id))
        return success({"deleted_id": desc_id}, "描述删除成功")
    finally:
        await db.close()


@router.get("/nodes/{node_id}/images")
async def list_images(node_id: int):
    db = await get_db()
    try:
        return success(await get_images(db, node_id))
    finally:
        await db.close()


@router.post("/nodes/{node_id}/images")
async def add_image(node_id: int, body: dict):
    db = await get_db()
    try:
        last_id, _ = await execute(
            db,
            "INSERT INTO node_images (node_id, image_url, title, description, order_index) VALUES (?, ?, ?, ?, (SELECT COUNT(*) FROM node_images WHERE node_id = ?))",
            (node_id, body["image_url"], body.get("title"), body.get("description"), node_id),
        )
        from app.database import query_one
        img = await query_one(db, "SELECT * FROM node_images WHERE id = ?", (last_id,))
        return success(img, "图片添加成功")
    finally:
        await db.close()


@router.delete("/nodes/{node_id}/images/{image_id}")
async def delete_image(node_id: int, image_id: int):
    db = await get_db()
    try:
        await execute(db, "DELETE FROM node_images WHERE id = ? AND node_id = ?", (image_id, node_id))
        return success({"deleted_id": image_id}, "图片删除成功")
    finally:
        await db.close()
