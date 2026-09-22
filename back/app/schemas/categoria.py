from pydantic import BaseModel, Field


class CategoriaBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    descripcion: str | None = None


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=100)
    descripcion: str | None = None


class CategoriaResponse(CategoriaBase):
    id: int

    model_config = {"from_attributes": True}
