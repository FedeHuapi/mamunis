import re
from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import AfterValidator, BaseModel, EmailStr, StringConstraints

from app.models.pedido import EstadoPedido

# Los datos de contacto son lo unico que tiene la tienda para cobrar y entregar un pedido.
# Estas reglas frenan lo que claramente no sirve ("123456", "asdf"); no pueden saber si el
# numero existe o si en esa direccion vive alguien. Las mismas reglas estan en el front
# (front/src/lib/checkout.ts) para avisar antes de enviar: si cambia una, cambia la otra.

LARGO_DE_UN_NUMERO = 10  # caracteristica + numero, sin 0 ni 15: 11 2345 6789, 351 234 5678
MINIMO_DE_LETRAS = 3


def numero_nacional(telefono: str) -> str | None:
    """Devuelve el telefono argentino en su forma de 10 digitos, o None si no parece uno.

    Acepta las formas en que la gente lo escribe: +54 9 11 2345-6789, (011) 15-2345-6789,
    0351 15 234 5678, 1123456789.
    """
    digitos = re.sub(r"\D", "", telefono)
    digitos = digitos.removeprefix("54").removeprefix("9").removeprefix("0")
    if len(digitos) == LARGO_DE_UN_NUMERO + 2:
        # El 15 de los celulares va despues de la caracteristica, que tiene 2, 3 o 4 digitos.
        for largo in (2, 3, 4):
            if digitos[largo : largo + 2] == "15":
                digitos = digitos[:largo] + digitos[largo + 2 :]
                break
    # Las caracteristicas argentinas son 11 (Buenos Aires) o empiezan con 2 o 3.
    caracteristica_valida = digitos.startswith("11") or digitos[:1] in ("2", "3")
    # 1111111111 tiene la forma correcta, pero no es un numero.
    if len(digitos) != LARGO_DE_UN_NUMERO or not caracteristica_valida or len(set(digitos)) < 3:
        return None
    return digitos


def _cantidad_de_letras(texto: str) -> int:
    return sum(caracter.isalpha() for caracter in texto)


def _validar_nombre(nombre: str) -> str:
    if _cantidad_de_letras(nombre) < 2:
        raise ValueError("El nombre no es válido")
    return nombre


def _validar_telefono(telefono: str) -> str:
    if numero_nacional(telefono) is None:
        raise ValueError("El teléfono tiene que ser un número argentino con característica, por ejemplo 11 2345 6789")
    return telefono


def _validar_direccion(direccion: str) -> str:
    # Una direccion tiene el nombre de una calle y una altura ("s/n" si no tiene numero).
    tiene_altura = any(caracter.isdigit() for caracter in direccion) or "s/n" in direccion.lower()
    if _cantidad_de_letras(direccion) < MINIMO_DE_LETRAS or not tiene_altura:
        raise ValueError("La dirección tiene que tener calle y número")
    return direccion


def _texto(maximo: int):
    return StringConstraints(strip_whitespace=True, min_length=1, max_length=maximo)


class PedidoCreate(BaseModel):
    session_id: UUID
    nombre_contacto: Annotated[str, _texto(150), AfterValidator(_validar_nombre)]
    email_contacto: EmailStr
    telefono_contacto: Annotated[str, _texto(50), AfterValidator(_validar_telefono)]
    direccion_envio: Annotated[str, _texto(300), AfterValidator(_validar_direccion)]


class CambiarEstadoRequest(BaseModel):
    estado: EstadoPedido


class ProductoEnPedido(BaseModel):
    id: int
    nombre: str
    imagen: str | None

    model_config = {"from_attributes": True}


class PedidoItemResponse(BaseModel):
    id: int
    producto: ProductoEnPedido
    talla: str
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
