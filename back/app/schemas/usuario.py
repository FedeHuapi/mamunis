from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UsuarioCreate(BaseModel):
    nombre: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    fecha_registro: datetime

    model_config = {"from_attributes": True}
