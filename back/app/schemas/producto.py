from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.producto import Talla
from app.schemas.categoria import CategoriaResponse


class ProductoBase(BaseModel):
    nombre: str = Field(..., max_length=150)
    descripcion: str | None = None
    precio: Decimal = Field(..., gt=0, decimal_places=2)
    talla: Talla
    categoria_id: int
    stock: int = Field(default=0, ge=0)
    imagen: str | None = None


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=150)
    descripcion: str | None = None
    precio: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    talla: Talla | None = None
    categoria_id: int | None = None
    stock: int | None = Field(default=None, ge=0)
    imagen: str | None = None


class ProductoResponse(ProductoBase):
    id: int
    categoria: CategoriaResponse

    model_config = {"from_attributes": True}
