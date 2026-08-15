"""Tag models (统一标签库：标签类型 + 标签，全局通用)."""
from pydantic import BaseModel
from typing import Optional


class TagTypeCreate(BaseModel):
    name: str


class TagCreate(BaseModel):
    name: str
    type_name: Optional[str] = None   # 所属标签类型文字
    parent_id: Optional[int] = None   # 父标签ID（树形结构，None=一级标签）
    color: Optional[str] = None
    description: Optional[str] = None  # 说明
    focus_id: Optional[int] = None     # 关联重点（planning_nodes 的 FOCUS_ITEM 节点ID）


class TagUpdate(BaseModel):
    name: Optional[str] = None
    type_name: Optional[str] = None
    parent_id: Optional[int] = None
    color: Optional[str] = None
    description: Optional[str] = None
    focus_id: Optional[int] = None
