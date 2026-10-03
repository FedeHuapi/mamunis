from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar("T")


class Pagina(BaseModel, Generic[T]):
    """Forma de todos los listados: una pagina de resultados y cuantos hay en total."""

    total: int
    items: list[T]


def paginar(query: Query, skip: int, limit: int) -> dict:
    # El total se cuenta con los filtros ya aplicados, pero sin skip ni limit:
    # es lo que el front necesita para saber cuantas paginas hay.
    return {"total": query.order_by(None).count(), "items": query.offset(skip).limit(limit).all()}
