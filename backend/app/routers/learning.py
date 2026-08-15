"""Learning records routes."""
import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.database import get_db, query, query_one, execute
from app.models import success, error
from app.core.auth import get_optional_user
from app.services.oss import oss_storage

router = APIRouter(prefix="/api/learning-records", tags=["学习记录"])


def _json_field(v):
    """list/dict 序列化为 JSON 字符串存储，其余类型原样返回。"""
    if isinstance(v, (list, dict)):
        return json.dumps(v, ensure_ascii=False)
    return v

# 记录上手动输入的新标签默认归入的类型
USER_TAG_TYPE = "错题标签"       # 知识点标签
ABILITY_TAG_TYPE = "题型能力标签"  # 题型能力标签


async def _ensure_user_tags(db, tag_names, focus_id=None, type_name=USER_TAG_TYPE) -> None:
    """把记录上携带的用户标签写入统一标签库（tags 表）。

    已存在的同名标签（任意类型下）不重复创建；新标签归属 type_name 指定的类型，
    类型不存在时自动创建。focus_id 为记录所属重点，新标签自动关联该重点，
    便于错题弹窗按重点过滤标签时复选。
    """
    names = []
    for n in tag_names or []:
        s = str(n).strip()
        if s and s not in names:
            names.append(s)
    if not names:
        return
    new_names = []
    for name in names:
        existing = await query_one(db, "SELECT id FROM tags WHERE kind='tag' AND name = ?", (name,))
        if not existing:
            new_names.append(name)
    if not new_names:
        return
    type_row = await query_one(db, "SELECT id FROM tags WHERE kind='type' AND name = ?", (type_name,))
    if not type_row:
        await execute(
            db,
            "INSERT INTO tags (name, kind, sort_order) VALUES (?, 'type', (SELECT COALESCE(MAX(sort_order),0)+1 FROM tags WHERE kind='type'))",
            (type_name,),
        )
    for name in new_names:
        await execute(
            db,
            "INSERT INTO tags (name, kind, type_name, focus_id) VALUES (?, 'tag', ?, ?)",
            (name, type_name, focus_id),
        )


@router.get("")
async def list_records(
    subject_id: int = None, phase_id: int = None,
    tags: str = None, date: str = None, execution_id: int = None,
    mastery_level: int = None, knowledge_point: str = None,
    page: int = 1, size: int = 50,
):
    db = await get_db()
    try:
        where = ["1=1"]
        params = []
        if subject_id:
            where.append("subject_id = ?")
            params.append(subject_id)
        if phase_id:
            where.append("phase_id = ?")
            params.append(phase_id)
        if tags:
            # 支持逗号分隔多个标签，取交集（每个都要匹配）
            for part in str(tags).split(","):
                part = part.strip()
                if part:
                    where.append("record_tags LIKE ?")
                    params.append(f"%{part}%")
        if date:
            where.append("record_date = ?")
            params.append(date)
        if execution_id:
            where.append("execution_id = ?")
            params.append(execution_id)
        if mastery_level is not None:
            where.append("mastery_level = ?")
            params.append(mastery_level)
        if knowledge_point:
            # 标签关键字同时匹配知识点和用户标签（record_tags 逗号分隔文本）
            where.append("(knowledge_point LIKE ? OR record_tags LIKE ?)")
            params.append(f"%{knowledge_point}%")
            params.append(f"%{knowledge_point}%")

        offset = (page - 1) * size
        rows = await query(
            db,
            f"SELECT * FROM learning_records WHERE {' AND '.join(where)} ORDER BY record_date DESC, id DESC LIMIT ? OFFSET ?",
            tuple(params) + (size, offset),
        )
        return success(rows)
    finally:
        await db.close()


@router.get("/{record_id}")
async def get_record(record_id: int):
    db = await get_db()
    try:
        row = await query_one(db, "SELECT * FROM learning_records WHERE id = ?", (record_id,))
        if not row:
            return error("记录不存在", 404)
        return success(row)
    finally:
        await db.close()


@router.post("/upload-attachment")
async def upload_attachment(file: UploadFile = File(...), user=Depends(get_optional_user)):
    """上传错题/反思附件到阿里云 OSS，返回 {key, url, name}。"""
    data = await file.read()
    if not data:
        raise HTTPException(400, "附件内容为空")
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(400, "附件大小不能超过 20MB")
    try:
        info = oss_storage.upload_attachment(data, file.filename or "attachment",
                                             prefix="learning-docs")
    except OSSError as e:
        raise HTTPException(502, str(e))
    return success({**info, "name": file.filename}, "附件上传成功")


@router.post("")
async def create_record(body: dict, user=Depends(get_optional_user)):
    db = await get_db()
    try:
        uid = user["user_id"] if user else 1
        last_id, _ = await execute(
            db,
            """INSERT INTO learning_records (user_id, subject_id, phase_id, record_date, record_tags,
               question_text, question_images, wrong_answer, correct_answer,
               knowledge_point, knowledge_note, knowledge_images,
               reflection_text, reflection_images, mastery_level, execution_id, attachments)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (uid, body["subject_id"], body.get("phase_id"), body.get("record_date", ""),
             body.get("record_tags", "mistake"), body.get("question_text"), body.get("question_images"),
             body.get("wrong_answer"), body.get("correct_answer"), body.get("knowledge_point"),
             body.get("knowledge_note"), body.get("knowledge_images"),
             body.get("reflection_text"), body.get("reflection_images"),
             body.get("mastery_level", 0), body.get("execution_id"),
             _json_field(body.get("attachments"))),
        )
        await _ensure_user_tags(db, body.get("tag_names"), body.get("subject_id"))
        await _ensure_user_tags(db, body.get("ability_tag_names"), body.get("subject_id"), ABILITY_TAG_TYPE)
        return success(await query_one(db, "SELECT * FROM learning_records WHERE id = ?", (last_id,)), "记录创建成功")
    finally:
        await db.close()


@router.put("/{record_id}")
async def update_record(record_id: int, body: dict):
    db = await get_db()
    try:
        fields = []
        values = []
        for key in ["subject_id", "phase_id", "record_date",
                    "record_tags", "question_text", "question_images", "wrong_answer", "correct_answer",
                    "knowledge_point", "knowledge_note", "knowledge_images",
                    "reflection_text", "reflection_images", "mastery_level", "status", "attachments"]:
            if key in body and body[key] is not None:
                fields.append(f"{key} = ?")
                values.append(_json_field(body[key]))
        if "review_count" in body:
            fields.append("review_count = ?")
            values.append(body["review_count"])
        if "last_review_date" in body:
            fields.append("last_review_date = ?")
            values.append(body["last_review_date"])
        if fields:
            fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(record_id)
            await execute(db, f"UPDATE learning_records SET {', '.join(fields)} WHERE id = ?", tuple(values))
        await _ensure_user_tags(db, body.get("tag_names"), body.get("subject_id"))
        await _ensure_user_tags(db, body.get("ability_tag_names"), body.get("subject_id"), ABILITY_TAG_TYPE)
        return success(await query_one(db, "SELECT * FROM learning_records WHERE id = ?", (record_id,)), "更新成功")
    finally:
        await db.close()


@router.delete("/{record_id}")
async def delete_record(record_id: int):
    db = await get_db()
    try:
        await execute(db, "DELETE FROM learning_records WHERE id = ?", (record_id,))
        return success({"deleted_id": record_id}, "删除成功")
    finally:
        await db.close()


@router.get("/stats/subject/{subject_id}")
async def subject_stats(subject_id: int):
    db = await get_db()
    try:
        rows = await query(
            db,
            """SELECT knowledge_point, COUNT(*) as record_count, AVG(mastery_level) as avg_mastery
               FROM learning_records WHERE subject_id = ? AND knowledge_point IS NOT NULL
               GROUP BY knowledge_point ORDER BY avg_mastery ASC""",
            (subject_id,),
        )
        counts = await query(
            db,
            "SELECT record_tags FROM learning_records WHERE subject_id = ?",
            (subject_id,),
        )
        mistake_count = sum(1 for r in counts if "mistake" in (r["record_tags"] or ""))
        knowledge_count = sum(1 for r in counts if "knowledge" in (r["record_tags"] or ""))
        reflection_count = sum(1 for r in counts if "reflection" in (r["record_tags"] or ""))
        return success({
            "knowledge_stats": rows,
            "mistake_count": mistake_count,
            "knowledge_count": knowledge_count,
            "reflection_count": reflection_count,
        })
    finally:
        await db.close()
