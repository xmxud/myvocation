"""Phase routes (phases_v2, phase_points, task_schedules)."""
from fastapi import APIRouter, Depends, UploadFile, File
from fastapi.responses import FileResponse
from app.database import get_db, query, query_one, execute
from app.models import success, error
from app.models.phase import PhaseCreate, PhaseUpdate, PhasePointCreate, PhasePointUpdate, TaskScheduleCreate
from app.core.auth import get_optional_user
import openpyxl
import io
import os

router = APIRouter(prefix="/api", tags=["阶段"])


# ── Phases CRUD ──

@router.get("/phases/by-node/{node_id}")
async def list_phases(node_id: int):
    db = await get_db()
    try:
        phases = await query(db, "SELECT * FROM phases_v2 WHERE node_id = ? ORDER BY sort_order, phase_number", (node_id,))
        for p in phases:
            p["points"] = await query(db, "SELECT * FROM phase_points WHERE phase_id = ? ORDER BY sort_order", (p["id"],))
        return success(phases)
    finally:
        await db.close()


@router.get("/phases/{phase_id}")
async def get_phase(phase_id: int):
    db = await get_db()
    try:
        phase = await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (phase_id,))
        if not phase:
            return error("阶段不存在", 404)
        phase["points"] = await query(db, "SELECT * FROM phase_points WHERE phase_id = ? ORDER BY sort_order", (phase_id,))
        return success(phase)
    finally:
        await db.close()


@router.post("/phases")
async def create_phase(body: PhaseCreate, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        last_id, _ = await execute(
            db,
            "INSERT INTO phases_v2 (user_id, node_id, parent_id, phase_number, title, start_date, end_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (uid, body.node_id, body.parent_id, body.phase_number, body.title, body.start_date, body.end_date, body.description, body.status),
        )
        phase = await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (last_id,))
        return success(phase, "阶段创建成功")
    finally:
        await db.close()


@router.put("/phases/{phase_id}")
async def update_phase(phase_id: int, body: PhaseUpdate):
    db = await get_db()
    try:
        fields = []
        values = []
        for key in ["phase_number", "title", "start_date", "end_date", "description", "status", "sort_order", "achievement_score", "score_remarks"]:
            if key in body.model_dump(exclude_none=True):
                fields.append(f"{key} = ?")
                values.append(getattr(body, key))
        if not fields:
            return success(await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (phase_id,)))
        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(phase_id)
        await execute(db, f"UPDATE phases_v2 SET {', '.join(fields)} WHERE id = ?", tuple(values))
        phase = await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (phase_id,))
        return success(phase, "阶段更新成功")
    finally:
        await db.close()


@router.delete("/phases/{phase_id}")
async def delete_phase(phase_id: int):
    db = await get_db()
    try:
        _, changes = await execute(db, "DELETE FROM phases_v2 WHERE id = ?", (phase_id,))
        if changes == 0:
            return error("阶段不存在", 404)
        return success({"deleted_id": phase_id}, "阶段删除成功")
    finally:
        await db.close()


@router.put("/phases/{phase_id}/scores")
async def update_scores(phase_id: int, body: dict):
    """Update achievement_score and score_remarks. execution_score is auto-calculated."""
    db = await get_db()
    try:
        await execute(
            db,
            "UPDATE phases_v2 SET achievement_score = ?, score_remarks = ?, scored_at = datetime('now'), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (body.get("achievement_score"), body.get("score_remarks"), phase_id),
        )
        # Auto-calculate composite_score
        await execute(
            db,
            "UPDATE phases_v2 SET composite_score = COALESCE(execution_score, 0) * 0.6 + COALESCE(achievement_score, 0) * 0.4 WHERE id = ?",
            (phase_id,),
        )
        phase = await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (phase_id,))
        return success(phase, "评分更新成功")
    finally:
        await db.close()


# ── Phase Points ──

@router.get("/phases/{phase_id}/points")
async def list_points(phase_id: int, type: str = None):
    db = await get_db()
    try:
        if type:
            rows = await query(db, "SELECT * FROM phase_points WHERE phase_id = ? AND point_type = ? ORDER BY sort_order", (phase_id, type))
        else:
            rows = await query(db, "SELECT * FROM phase_points WHERE phase_id = ? ORDER BY sort_order", (phase_id,))
        return success(rows)
    finally:
        await db.close()


@router.post("/phases/{phase_id}/points")
async def add_point(phase_id: int, body: PhasePointCreate):
    db = await get_db()
    try:
        last_id, _ = await execute(
            db,
            "INSERT INTO phase_points (phase_id, point_type, content, node_id, extra_data) VALUES (?, ?, ?, ?, ?)",
            (phase_id, body.point_type, body.content, body.node_id, body.extra_data),
        )
        point = await query_one(db, "SELECT * FROM phase_points WHERE id = ?", (last_id,))
        return success(point, "条目添加成功")
    finally:
        await db.close()


@router.put("/phases/points/{point_id}")
async def update_point(point_id: int, body: PhasePointUpdate):
    db = await get_db()
    try:
        fields = []
        values = []
        if body.content is not None:
            fields.append("content = ?")
            values.append(body.content)
        if body.extra_data is not None:
            fields.append("extra_data = ?")
            values.append(body.extra_data)
        if body.node_id is not None:
            fields.append("node_id = ?")
            values.append(body.node_id)
        if fields:
            fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(point_id)
            await execute(db, f"UPDATE phase_points SET {', '.join(fields)} WHERE id = ?", tuple(values))
        return success(await query_one(db, "SELECT * FROM phase_points WHERE id = ?", (point_id,)), "条目更新成功")
    finally:
        await db.close()


@router.delete("/phases/points/{point_id}")
async def delete_point(point_id: int):
    db = await get_db()
    try:
        await execute(db, "DELETE FROM phase_points WHERE id = ?", (point_id,))
        return success({"deleted_id": point_id}, "条目删除成功")
    finally:
        await db.close()


# ── Task Schedules ──

@router.get("/task-schedules")
async def list_schedules(phase_id: int = None, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        if phase_id:
            rows = await query(db, """
                SELECT ts.* FROM task_schedules ts
                JOIN phase_points pp ON pp.id = ts.point_id
                WHERE pp.phase_id = ? AND ts.user_id = ?
            """, (phase_id, uid))
        else:
            rows = await query(db, "SELECT * FROM task_schedules WHERE user_id = ?", (uid,))
        return success(rows)
    finally:
        await db.close()


@router.post("/task-schedules")
async def create_schedule(body: TaskScheduleCreate, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        last_id, _ = await execute(
            db,
            "INSERT INTO task_schedules (user_id, point_id, schedule_type, is_active) VALUES (?, ?, ?, ?)",
            (uid, body.point_id, body.schedule_type, body.is_active),
        )
        sched = await query_one(db, "SELECT * FROM task_schedules WHERE id = ?", (last_id,))
        return success(sched, "调度创建成功")
    finally:
        await db.close()


@router.put("/task-schedules/{schedule_id}")
async def update_schedule(schedule_id: int, body: dict):
    db = await get_db()
    try:
        fields = []
        values = []
        for key in ["schedule_type", "is_active", "cron_expression", "next_generated_date"]:
            if key in body and body[key] is not None:
                fields.append(f"{key} = ?")
                values.append(body[key])
        if fields:
            fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(schedule_id)
            await execute(db, f"UPDATE task_schedules SET {', '.join(fields)} WHERE id = ?", tuple(values))
        return success(await query_one(db, "SELECT * FROM task_schedules WHERE id = ?", (schedule_id,)), "调度更新成功")
    finally:
        await db.close()


@router.delete("/task-schedules/{schedule_id}")
async def delete_schedule(schedule_id: int):
    db = await get_db()
    try:
        await execute(db, "DELETE FROM task_schedules WHERE id = ?", (schedule_id,))
        return success({"deleted_id": schedule_id}, "调度删除成功")
    finally:
        await db.close()


# ── Excel Import ──

@router.get("/phases/template/download")
async def download_template():
    """下载阶段规划导入模板"""
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "阶段规划模版.xlsx")
    return FileResponse(path, filename="阶段规划模版.xlsx",
                        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")


@router.post("/phases/{phase_id}/import-excel")
async def import_points(phase_id: int, file: UploadFile = File(...)):
    """从 Excel 导入阶段条目"""
    db = await get_db()
    try:
        contents = await file.read()
        wb = openpyxl.load_workbook(io.BytesIO(contents))
        ws = wb.active

        # Get all phases of this theme for phase_number matching
        current_phase = await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (phase_id,))
        if not current_phase:
            return error("阶段不存在", 404)
        theme_phases = await query(db, "SELECT * FROM phases_v2 WHERE node_id = ?", (current_phase["node_id"],))
        # Get FOCUS_ITEM children for 关联重点项目 matching
        focus_items = await query(db,
            "SELECT * FROM planning_nodes WHERE parent_id = ? AND node_type = 'FOCUS_ITEM'",
            (current_phase["node_id"],))

        imported = 0
        errors_list = []

        for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            phase_num, focus_name, content, point_type = row
            if not content:
                continue

            # Match phase
            target_phase_id = phase_id  # default: current phase
            if phase_num:
                matched = [p for p in theme_phases if str(p["phase_number"]) == str(phase_num)]
                if matched:
                    target_phase_id = matched[0]["id"]
                else:
                    errors_list.append(f"第{row_idx}行: 阶段编号 {phase_num} 未找到")
                    continue

            # Match FOCUS_ITEM
            node_id = None
            if focus_name:
                matched = [f for f in focus_items if f["title"] == str(focus_name) or f["codename"] == str(focus_name)]
                if matched:
                    node_id = matched[0]["id"]

            # Map type
            type_map = {"目标": "goal", "检查点": "checkpoint", "行动指南": "action"}
            pt = type_map.get(str(point_type) if point_type else "", "action")

            await execute(db,
                "INSERT INTO phase_points (phase_id, point_type, content, node_id) VALUES (?, ?, ?, ?)",
                (target_phase_id, pt, str(content), node_id))
            imported += 1

        await db.commit()
        return success({"imported": imported, "errors": errors_list},
                       f"导入 {imported} 条" + (f"，{len(errors_list)} 条失败" if errors_list else ""))
    except Exception as e:
        return error(str(e), 500)
    finally:
        await db.close()
