from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.pedido import EstadoPedido


class PedidoCreate(BaseModel):
    session_id: UUID
    nombre_contacto: str = Field(..., max_length=150)
    email_contacto: EmailStr
    telefono_contacto: str = Field(..., max_length=50)
    direccion_envio: str


class ProductoEnPedido(BaseModel):
    id: int
    nombre: str
    imagen: str | None

    model_config = {"from_attributes": True}


class PedidoItemResponse(BaseModel):
    id: int
    producto: ProductoEnPedido
    cantidad: int
    precio_unitario: Decimal

    model_config = {"from_attributes": True}


class PedidoResponse(BaseModel):
    id: int
    estado: EstadoPedido
    nombre_contacto: str
    email_contacto: EmailStr
    telefono_contacto: str
    direccion_envio: str
    total: Decimal
    fecha_creacion: datetime
    items: list[PedidoItemResponse]

    model_config = {"from_attributes": True}
