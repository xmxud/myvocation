"""Planning node models (THEME, FOCUS_ITEM, TASK, SUBTASK)."""
from pydantic import BaseModel
from typing import Optional


class NodeCreate(BaseModel):
    node_type: str
    title: str
    codename: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    user_id: Optional[int] = None
    priority: Optional[str] = None
    task_type: Optional[str] = None
    tag: Optional[str] = None
    extra_data: Optional[str] = None


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    codename: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    progress_percent: Optional[int] = None
    user_id: Optional[int] = None
    priority: Optional[str] = None
    task_type: Optional[str] = None
    tag: Optional[str] = None
    extra_data: Optional[str] = None
