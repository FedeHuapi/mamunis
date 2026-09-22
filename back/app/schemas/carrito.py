from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CarritoCreado(BaseModel):
    session_id: UUID
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


class ProductoEnItem(BaseModel):
    id: int
    nombre: str
    precio: Decimal
    imagen: str | None

    model_config = {"from_attributes": True}


class CarritoItemResponse(BaseModel):
    id: int
    producto: ProductoEnItem
    cantidad: int

    model_config = {"from_attributes": True}


class CarritoResponse(BaseModel):
    session_id: UUID
    fecha_creacion: datetime
    items: list[CarritoItemResponse]
    total: Decimal

    model_config = {"from_attributes": True}


class AgregarItemRequest(BaseModel):
    producto_id: int
    cantidad: int = Field(..., gt=0)


class ActualizarCantidadRequest(BaseModel):
    cantidad: int = Field(..., gt=0)
