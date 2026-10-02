from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field, field_validator

from app.models.producto import TALLAS
from app.schemas.categoria import CategoriaResponse


def _validar_talla(talla: str) -> str:
    if talla not in TALLAS:
        raise ValueError(f"Talle no valido. Opciones: {', '.join(TALLAS)}")
    return talla


TallaValida = Annotated[str, AfterValidator(_validar_talla)]


class VarianteCreate(BaseModel):
    talla: TallaValida
    stock: int = Field(default=0, ge=0)


class VarianteUpdate(BaseModel):
    stock: int = Field(..., ge=0)


class VarianteResponse(BaseModel):
    id: int
    talla: str
    stock: int

    model_config = {"from_attributes": True}


class ProductoBase(BaseModel):
    nombre: str = Field(..., max_length=150)
    descripcion: str | None = None
    precio: Decimal = Field(..., gt=0, decimal_places=2)
    categoria_id: int
    imagen: str | None = None


class ProductoCreate(ProductoBase):
    variantes: list[VarianteCreate] = []

    @field_validator("variantes")
    @classmethod
    def _sin_tallas_repetidas(cls, variantes: list[VarianteCreate]) -> list[VarianteCreate]:
        tallas = [variante.talla for variante in variantes]
        if len(tallas) != len(set(tallas)):
            raise ValueError("Hay talles repetidos")
        return variantes


class ProductoUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=150)
    descripcion: str | None = None
    precio: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    categoria_id: int | None = None
    imagen: str | None = None


class ProductoResponse(ProductoBase):
    id: int
    categoria: CategoriaResponse
    variantes: list[VarianteResponse]

    model_config = {"from_attributes": True}
