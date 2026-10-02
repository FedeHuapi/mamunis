from collections import defaultdict
from collections.abc import Iterable

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.pedido import EstadoPedido, Pedido
from app.models.producto import Variante

TRANSICIONES_VALIDAS: dict[EstadoPedido, set[EstadoPedido]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.CONFIRMADO, EstadoPedido.CANCELADO},
    EstadoPedido.CONFIRMADO: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENVIADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENVIADO: {EstadoPedido.ENTREGADO},
    EstadoPedido.ENTREGADO: set(),
    EstadoPedido.CANCELADO: set(),
}


class TransicionInvalida(Exception):
    def __init__(self, actual: EstadoPedido, nuevo: EstadoPedido):
        super().__init__(f"No se puede pasar un pedido de '{actual.value}' a '{nuevo.value}'")


class StockInsuficiente(Exception):
    def __init__(self, variante_id: int):
        self.variante_id = variante_id
        super().__init__(f"Stock insuficiente para la variante {variante_id}")


def cantidades_por_variante(items: Iterable) -> dict[int, int]:
    cantidades: dict[int, int] = defaultdict(int)
    for item in items:
        cantidades[item.variante_id] += item.cantidad
    return dict(cantidades)


def validar_transicion(actual: EstadoPedido, nuevo: EstadoPedido) -> None:
    if nuevo not in TRANSICIONES_VALIDAS[actual]:
        raise TransicionInvalida(actual, nuevo)


def cambiar_estado(db: Session, pedido: Pedido, nuevo: EstadoPedido) -> None:
    validar_transicion(pedido.estado, nuevo)
    if nuevo == EstadoPedido.CANCELADO:
        devolver_stock(db, cantidades_por_variante(pedido.items))
    pedido.estado = nuevo


# El stock vive en la variante (un talle de un producto). Siempre se modifica con un UPDATE que calcula la base de datos
# (stock = stock - n), nunca leyendo el valor en Python y escribiendo el resultado:
# entre esa lectura y esa escritura, otra compra o cancelacion podria cambiarlo.
# Se recorren las variantes en orden de id para que dos operaciones que tocan las
# mismas variantes las bloqueen en el mismo orden y no queden esperandose (deadlock).

def reservar_stock(db: Session, cantidades: dict[int, int]) -> None:
    for variante_id in sorted(cantidades):
        cantidad = cantidades[variante_id]
        resultado = db.execute(
            update(Variante)
            .where(Variante.id == variante_id, Variante.stock >= cantidad)
            .values(stock=Variante.stock - cantidad)
        )
        if resultado.rowcount != 1:
            raise StockInsuficiente(variante_id)


def devolver_stock(db: Session, cantidades: dict[int, int]) -> None:
    for variante_id in sorted(cantidades):
        db.execute(
            update(Variante)
            .where(Variante.id == variante_id)
            .values(stock=Variante.stock + cantidades[variante_id])
        )
