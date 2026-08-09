"""Daily executions routes."""
import json
from datetime import date as date_cls, timedelta

from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db, query, query_one, execute
from app.models import success, error
from app.core.auth import get_optional_user
from app.services.llm import chat_json, LLMError

router = APIRouter(prefix="/api/daily-executions", tags=["每日执行"])


@router.get("/{node_id}")
async def list_executions(node_id: int, phase_id: int = None, date: str = None):
    db = await get_db()
    try:
        # node_id 通常为 THEME/FOCUS_ITEM；按节点子树查询，
        # 使挂在子节点（如重点项）上的执行记录也能被列出
        sql = """WITH RECURSIVE subtree AS (
                   SELECT id FROM planning_nodes WHERE id = ?
                   UNION ALL
                   SELECT n.id FROM planning_nodes n
                   JOIN subtree s ON n.parent_id = s.id
                 )
                 SELECT * FROM daily_executions
                 WHERE node_id IN (SELECT id FROM subtree)"""
        params = [node_id]
        if phase_id:
            sql += " AND phase_id = ?"
            params.append(phase_id)
        if date:
            sql += " AND execution_date = ?"
            params.append(date)
        sql += " ORDER BY execution_date DESC, id DESC"
        rows = await query(db, sql, tuple(params))
        return success(rows)
    finally:
        await db.close()


@router.post("/ai-generate")
async def ai_generate_executions(body: dict, user=Depends(get_optional_user)):
    """根据阶段行动指南（含父阶段）调用千问生成该阶段每一天的执行任务。

    幂等策略：先清除该阶段下 source='auto' 的旧记录，再写入新生成的任务。
    """
    phase_id = body.get("phase_id")
    if not phase_id:
        raise HTTPException(400, "缺少 phase_id")

    db = await get_db()
    try:
        phase = await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (phase_id,))
        if not phase:
            raise HTTPException(404, "阶段不存在")

        # 收集本阶段及全部父阶段的行动指南（point_type='action'）
        chain = []  # [(phase_row, [action_points])]，0=本阶段，之后依次为父/祖父阶段
        cur = phase
        while cur:
            pts = await query(
                db,
                "SELECT * FROM phase_points WHERE phase_id = ? AND point_type = 'action'"
                " ORDER BY sort_order, id",
                (cur["id"],),
            )
            chain.append((cur, pts))
            if cur["parent_id"]:
                cur = await query_one(db, "SELECT * FROM phases_v2 WHERE id = ?", (cur["parent_id"],))
            else:
                cur = None

        if not any(pts for _, pts in chain):
            raise HTTPException(400, "该阶段及其父阶段均无行动指南条目，无法生成")

        # 加载该主题下的科目（FOCUS_ITEM 子节点），用于把任务关联到对应科目
        subjects = await query(
            db,
            "SELECT id, title FROM planning_nodes"
            " WHERE parent_id = ? AND node_type = 'FOCUS_ITEM' ORDER BY id",
            (phase["node_id"],),
        )
        subject_lines = "\n".join(f"- id={s['id']}：{s['title']}" for s in subjects) or "（无）"

        # 日期范围
        try:
            start = date_cls.fromisoformat(phase["start_date"])
            end = date_cls.fromisoformat(phase["end_date"])
        except (TypeError, ValueError):
            raise HTTPException(400, "阶段日期格式无效")
        if end < start:
            raise HTTPException(400, "阶段日期范围无效")
        days = [start + timedelta(days=i) for i in range((end - start).days + 1)]
        if len(days) > 62:
            raise HTTPException(400, "阶段跨度超过 62 天，请先拆分阶段再生成")

        # 组装提示词
        weekday_cn = "一二三四五六日"
        date_list = "、".join(
            f"{d.isoformat()}(周{weekday_cn[d.weekday()]})" for d in days
        )

        def fmt_actions(pts):
            lines = []
            for p in pts:
                extra = {}
                if p["extra_data"]:
                    try:
                        extra = json.loads(p["extra_data"])
                    except (json.JSONDecodeError, TypeError):
                        extra = {}
                freq = {"daily": "每日", "weekly": "每周", "once": "一次"}.get(
                    extra.get("frequency"), extra.get("frequency") or ""
                )
                minutes = extra.get("estimated_minutes")
                suffix = ""
                if freq or minutes:
                    suffix = f"（{freq}{('，约' + str(minutes) + '分钟') if minutes else ''}）"
                lines.append(f"- {p['content']}{suffix}")
            return "\n".join(lines) if lines else "（无）"

        own_actions = fmt_actions(chain[0][1])
        parent_actions = "\n".join(
            f"【父阶段 {p['phase_number']}. {p['title']}】\n{fmt_actions(pts)}"
            for p, pts in chain[1:]
        ) or "（无）"

        messages = [
            {"role": "system", "content":
             "你是一名学习计划助手，擅长把阶段行动指南拆解为每天可执行的具体任务。"
             "只输出 JSON，不要输出任何解释性文字。"},
            {"role": "user", "content": f"""阶段：{phase['phase_number']}. {phase['title']}
日期范围：{phase['start_date']} 至 {phase['end_date']}

本阶段行动指南：
{own_actions}

父阶段行动指南（在整个阶段期间持续生效，也需要安排进每天）：
{parent_actions}

科目列表（任务必须关联到对应科目，focus_id 取这里的 id）：
{subject_lines}

请为该阶段的每一天生成 6-10 项执行任务，要求：
1. 每条任务必须根据内容关联到对应科目，输出 focus_id（取自上方科目列表的 id）；实在无法归类的用 null
2. 覆盖上述全部行动指南，且要顾及所有科目：每天安排不同科目的任务，整个阶段内每个科目都应被安排到
3. 频次为"每日"的行动指南，每天必须安排在相同的固定时间（planned_start_time 逐日保持一致）
4. 每日任务合理分配在 06:30-23:30 之间，时间不重叠，中午 12:00-13:30 可安排休息/午餐，晚上 22:00-23:30 之间安排复盘总结
5. title 为简洁的任务描述（含具体内容，如"数学每日一练：函数专项 10 题"）
6. planned_start_time 格式 "HH:MM"，planned_duration 为整数分钟
7. date 必须严格取自以下日期：{date_list}
8. 每周可安排 1 天任务量稍轻的总结/复盘日，需要分时间段安排每门科目的复盘

输出 JSON 格式：
{{"days": [{{"date": "YYYY-MM-DD", "tasks": [{{"title": "...", "focus_id": 12, "planned_start_time": "08:00", "planned_duration": 30}}]}}]}}"""},
        ]

        try:
            result = await chat_json(messages)
        except LLMError as e:
            raise HTTPException(502, str(e))

        # 解析并校验生成结果
        valid_dates = {d.isoformat() for d in days}
        valid_focus = {s["id"] for s in subjects}
        items = []
        for day in result.get("days", []):
            dt = day.get("date")
            if dt not in valid_dates:
                continue
            for t in (day.get("tasks") or [])[:8]:
                title = str(t.get("title") or "").strip()
                if not title:
                    continue
                try:
                    duration = int(t["planned_duration"]) if t.get("planned_duration") is not None else None
                except (TypeError, ValueError):
                    duration = None
                start_time = t.get("planned_start_time")
                if not (isinstance(start_time, str) and len(start_time) == 5 and ":" in start_time):
                    start_time = None
                # 科目关联：仅接受科目列表内的 id，否则回退到阶段所属节点
                try:
                    focus_id = int(t["focus_id"]) if t.get("focus_id") is not None else None
                except (TypeError, ValueError):
                    focus_id = None
                if focus_id not in valid_focus:
                    focus_id = None
                items.append((dt, focus_id or phase["node_id"], title, start_time, duration))

        if not items:
            raise HTTPException(502, "AI 未生成任何有效任务，请重试")

        # 清除该阶段旧的自动生成记录，写入新任务
        await execute(db, "DELETE FROM daily_executions WHERE phase_id = ? AND source = 'auto'", (phase_id,))
        uid = phase["user_id"] or (user["user_id"] if user else 1)
        for dt, node_id, title, start_time, duration in items:
            await execute(
                db,
                """INSERT INTO daily_executions
                   (node_id, phase_id, user_id, execution_date, title,
                    planned_start_time, planned_duration, source,
                    is_done, completion_percent, result_score)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'auto', 0, 0, 0)""",
                (node_id, phase_id, uid, dt, title, start_time, duration),
            )

        return success(
            {"phase_id": phase_id, "days": len({i[0] for i in items}), "created": len(items)},
            f"已生成 {len(items)} 项任务",
        )
    finally:
        await db.close()


@router.post("")
async def create_execution(body: dict, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        last_id, _ = await execute(
            db,
            """INSERT INTO daily_executions
               (node_id, phase_id, user_id, execution_date, title,
                planned_start_time, planned_duration, source, source_point_id,
                is_done, completion_percent, notes, duration_minutes, result_score)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (body.get("node_id"), body.get("phase_id"), uid,
             body.get("execution_date", ""), body.get("title"),
             body.get("planned_start_time"), body.get("planned_duration"),
             body.get("source", "manual"), body.get("source_point_id"),
             body.get("is_done", 0), body.get("completion_percent", 0),
             body.get("notes"), body.get("duration_minutes"), body.get("result_score", 0)),
        )
        row = await query_one(db, "SELECT * FROM daily_executions WHERE id = ?", (last_id,))
        return success(row, "执行记录创建成功")
    finally:
        await db.close()


@router.put("/{exec_id}")
async def update_execution(exec_id: int, body: dict):
    db = await get_db()
    try:
        fields = []
        values = []
        for key in ["title", "planned_start_time", "planned_duration", "is_done",
                     "completion_percent", "duration_minutes", "notes", "result_score",
                     "mood", "execution_date"]:
            if key in body and body[key] is not None:
                fields.append(f"{key} = ?")
                values.append(body[key])
        if not fields:
            return success(await query_one(db, "SELECT * FROM daily_executions WHERE id = ?", (exec_id,)))
        fields.append("updated_at = CURRENT_TIMESTAMP")
        values.append(exec_id)
        await execute(db, f"UPDATE daily_executions SET {', '.join(fields)} WHERE id = ?", tuple(values))
        return success(await query_one(db, "SELECT * FROM daily_executions WHERE id = ?", (exec_id,)), "更新成功")
    finally:
        await db.close()


@router.delete("")
async def clear_phase_executions(phase_id: int = None):
    """清空某阶段下的全部执行任务（用于"清空阶段计划"）。"""
    if not phase_id:
        raise HTTPException(400, "缺少 phase_id")
    db = await get_db()
    try:
        _, changes = await execute(db, "DELETE FROM daily_executions WHERE phase_id = ?", (phase_id,))
        return success({"phase_id": phase_id, "deleted": changes}, f"已清空 {changes} 项任务")
    finally:
        await db.close()


@router.delete("/{exec_id}")
async def delete_execution(exec_id: int):
    db = await get_db()
    try:
        await execute(db, "DELETE FROM daily_executions WHERE id = ?", (exec_id,))
        return success({"deleted_id": exec_id}, "删除成功")
    finally:
        await db.close()
