"""Planning nodes service."""
from app.database import query, query_one, execute


async def get_children(db, parent_id: int, user_id: int) -> list[dict]:
    return await query(
        db,
        "SELECT * FROM planning_nodes WHERE parent_id = ? AND user_id = ? ORDER BY sort_order ASC",
        (parent_id, user_id),
    )


async def get_node(db, node_id: int) -> dict | None:
    return await query_one(db, "SELECT * FROM planning_nodes WHERE id = ?", (node_id,))


async def create_node(db, node: dict, user_id: int) -> dict:
    last_id, _ = await execute(
        db,
        """INSERT INTO planning_nodes (node_type, title, codename, description, parent_id, priority, task_type, tag, extra_data, user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (node["node_type"], node["title"], node.get("codename"), node.get("description"),
         node.get("parent_id"), node.get("priority"), node.get("task_type"),
         node.get("tag"), node.get("extra_data"), user_id),
    )
    return await get_node(db, last_id)


async def update_node(db, node_id: int, updates: dict) -> dict | None:
    fields = []
    values = []
    for key in ["title", "codename", "description", "is_completed", "progress_percent",
                "priority", "task_type", "tag", "extra_data", "user_id"]:
        if key in updates and updates[key] is not None:
            fields.append(f"{key} = ?")
            values.append(updates[key])
    if not fields:
        return await get_node(db, node_id)
    fields.append("updated_at = CURRENT_TIMESTAMP")
    values.append(node_id)
    await execute(db, f"UPDATE planning_nodes SET {', '.join(fields)} WHERE id = ?", tuple(values))
    return await get_node(db, node_id)


async def delete_node(db, node_id: int) -> int:
    _, changes = await execute(db, "DELETE FROM planning_nodes WHERE id = ?", (node_id,))
    return changes


async def get_full_tree(db, node_id: int) -> dict | None:
    node = await get_node(db, node_id)
    if not node:
        return None

    async def build_tree(parent_id: int) -> list[dict]:
        children = await query(
            db,
            "SELECT * FROM planning_nodes WHERE parent_id = ? ORDER BY sort_order",
            (parent_id,),
        )
        for child in children:
            child["children"] = await build_tree(child["id"])
        return children

    node["children"] = await build_tree(node_id)
    return node


async def get_descriptions(db, node_id: int) -> list[dict]:
    return await query(
        db,
        "SELECT * FROM node_descriptions WHERE node_id = ? ORDER BY order_index",
        (node_id,),
    )


async def get_images(db, node_id: int) -> list[dict]:
    return await query(
        db,
        "SELECT * FROM node_images WHERE node_id = ? ORDER BY order_index",
        (node_id,),
    )
