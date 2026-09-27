from app.models.pedido import EstadoPedido, Pedido

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


def cambiar_estado(pedido: Pedido, nuevo: EstadoPedido) -> None:
    if nuevo not in TRANSICIONES_VALIDAS[pedido.estado]:
        raise TransicionInvalida(pedido.estado, nuevo)
    if nuevo == EstadoPedido.CANCELADO:
        for item in pedido.items:
            item.producto.stock += item.cantidad
    pedido.estado = nuevo
