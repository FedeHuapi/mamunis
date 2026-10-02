from types import SimpleNamespace

import pytest

from app.models.pedido import EstadoPedido
from app.services.pedido_service import TransicionInvalida, cantidades_por_variante, validar_transicion

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


@pytest.mark.parametrize("actual,nuevo", TRANSICIONES_PERMITIDAS)
def test_transicion_permitida(actual, nuevo):
    validar_transicion(actual, nuevo)


@pytest.mark.parametrize("actual,nuevo", TRANSICIONES_PROHIBIDAS)
def test_transicion_prohibida(actual, nuevo):
    with pytest.raises(TransicionInvalida):
        validar_transicion(actual, nuevo)


def test_cantidades_por_variante_suma_items_de_la_misma_variante():
    items = [
        SimpleNamespace(variante_id=1, cantidad=2),
        SimpleNamespace(variante_id=2, cantidad=1),
        SimpleNamespace(variante_id=1, cantidad=3),
    ]

    assert cantidades_por_variante(items) == {1: 5, 2: 1}
