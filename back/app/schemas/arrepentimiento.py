from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import AfterValidator, BaseModel, BeforeValidator, Field, StringConstraints

from app.models.arrepentimiento import EstadoArrepentimiento
from app.models.pedido import EstadoPedido
from app.schemas.pedido import numero_nacional
from app.schemas.usuario import EmailNormalizado


def _validar_nombre(nombre: str) -> str:
    if sum(caracter.isalpha() for caracter in nombre) < 2:
        raise ValueError("El nombre no es válido")
    return nombre


def _validar_telefono(telefono: str | None) -> str | None:
    if telefono and numero_nacional(telefono) is None:
        raise ValueError("El teléfono tiene que ser un número argentino con característica, por ejemplo 11 2345 6789")
    return telefono


def _vacio_es_none(valor):
    # Un campo opcional que llega vacio o con espacios cuenta como que no se completo.
    if isinstance(valor, str) and not valor.strip():
        return None
    return valor


def _texto_opcional(maximo: int):
    # El limite de largo va adentro: se aplica solo cuando hay texto, no cuando viene None.
    texto = Annotated[str, StringConstraints(strip_whitespace=True, max_length=maximo)]
    return Annotated[texto | None, BeforeValidator(_vacio_es_none)]


class ArrepentimientoCreate(BaseModel):
    """Lo que completa la persona. La norma no deja pedir registro ni otro tramite previo:
    por eso alcanza con nombre y email, y el numero de pedido es opcional."""

    nombre: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150), AfterValidator(_validar_nombre)]
    email: EmailNormalizado
    telefono: Annotated[_texto_opcional(50), AfterValidator(_validar_telefono)] = None
    numero_pedido: Annotated[Annotated[int, Field(ge=1, le=2_147_483_647)] | None, BeforeValidator(_vacio_es_none)] = None
    motivo: _texto_opcional(1000) = None


class ArrepentimientoCreado(BaseModel):
    """La respuesta publica: solo el codigo y la fecha. A proposito no dice si el numero de
    pedido existe o si coincidio con el email, para que nadie lo use para averiguar pedidos."""

    codigo: str
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


class PedidoDelArrepentimiento(BaseModel):
    id: int
    estado: EstadoPedido
    total: Decimal
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


class ArrepentimientoResponse(BaseModel):
    id: int
    codigo: str
    nombre: str
    email: str
    telefono: str | None
    numero_pedido: int | None
    motivo: str | None
    estado: EstadoArrepentimiento
    fecha_creacion: datetime
    # El pedido, solo si el numero y el email coincidieron.
    pedido: PedidoDelArrepentimiento | None

    model_config = {"from_attributes": True}


class CambiarEstadoArrepentimiento(BaseModel):
    estado: EstadoArrepentimiento
