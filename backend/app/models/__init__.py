"""Pydantic response models."""
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class Response(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: Optional[T] = None


class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int = 1
    size: int = 20


def success(data=None, message: str = "success") -> dict:
    return {"code": 0, "message": message, "data": data}


def error(message: str = "error", code: int = 500) -> dict:
    return {"code": code, "message": message, "data": None}
