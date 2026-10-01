from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr, Field

# Los emails se guardan y se comparan siempre en minusculas: Fede@mail.com y
# fede@mail.com son la misma cuenta.
EmailNormalizado = Annotated[EmailStr, AfterValidator(str.lower)]


class UsuarioCreate(BaseModel):
    nombre: str = Field(..., max_length=150)
    email: EmailNormalizado
    password: str = Field(..., min_length=8, max_length=72)


class UsuarioLogin(BaseModel):
    email: EmailNormalizado
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    es_admin: bool
    fecha_registro: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
