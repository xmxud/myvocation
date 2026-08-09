"""Phase models (phases_v2, phase_points, task_schedules)."""
from pydantic import BaseModel
from typing import Optional


class PhaseCreate(BaseModel):
    node_id: int
    parent_id: Optional[int] = None
    phase_number: str
    title: str
    start_date: str
    end_date: str
    description: Optional[str] = None
    status: str = "upcoming"


class PhaseUpdate(BaseModel):
    phase_number: Optional[str] = None
    title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    sort_order: Optional[int] = None
    achievement_score: Optional[float] = None
    score_remarks: Optional[str] = None


class PhasePointCreate(BaseModel):
    point_type: str
    content: str
    node_id: Optional[int] = None
    extra_data: Optional[str] = None


class PhasePointUpdate(BaseModel):
    content: Optional[str] = None
    node_id: Optional[int] = None
    extra_data: Optional[str] = None


class TaskScheduleCreate(BaseModel):
    point_id: int
    schedule_type: str = "daily"
    is_active: bool = True
