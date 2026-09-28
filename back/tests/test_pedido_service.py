import pytest

from app.models.pedido import EstadoPedido, Pedido, PedidoItem
from app.models.producto import Producto
from app.services.pedido_service import TransicionInvalida, cambiar_estado

E = EstadoPedido

TRANSICIONES_PERMITIDAS = [
    (E.PENDIENTE, E.CONFIRMADO),
    (E.PENDIENTE, E.CANCELADO),
    (E.CONFIRMADO, E.EN_PREPARACION),
    (E.CONFIRMADO, E.CANCELADO),
    (E.EN_PREPARACION, E.ENVIADO),
    (E.EN_PREPARACION, E.CANCELADO),
    (E.ENVIADO, E.ENTREGADO),
]

TODAS_LAS_TRANSICIONES = [(actual, nuevo) for actual in E for nuevo in E]
TRANSICIONES_PROHIBIDAS = [t for t in TODAS_LAS_TRANSICIONES if t not in TRANSICIONES_PERMITIDAS]


def _pedido(estado, stock_producto=3, cantidad=2):
    producto = Producto(nombre="Remera", stock=stock_producto)
    return Pedido(estado=estado, items=[PedidoItem(producto=producto, cantidad=cantidad)])


@pytest.mark.parametrize("actual,nuevo", TRANSICIONES_PERMITIDAS)
def test_transicion_permitida(actual, nuevo):
    pedido = _pedido(actual)

    cambiar_estado(pedido, nuevo)

    assert pedido.estado == nuevo


@pytest.mark.parametrize("actual,nuevo", TRANSICIONES_PROHIBIDAS)
def test_transicion_prohibida(actual, nuevo):
    pedido = _pedido(actual)

    with pytest.raises(TransicionInvalida):
        cambiar_estado(pedido, nuevo)

    assert pedido.estado == actual


def test_cancelar_devuelve_el_stock():
    pedido = _pedido(E.CONFIRMADO, stock_producto=3, cantidad=2)

    cambiar_estado(pedido, E.CANCELADO)

    assert pedido.items[0].producto.stock == 5


def test_avanzar_no_toca_el_stock():
    pedido = _pedido(E.CONFIRMADO, stock_producto=3, cantidad=2)

    cambiar_estado(pedido, E.EN_PREPARACION)

    assert pedido.items[0].producto.stock == 3
