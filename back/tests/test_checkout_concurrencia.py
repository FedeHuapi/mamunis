"""Tests de concurrencia sobre el stock.

No dependen de la suerte: en vez de lanzar requests a la vez y esperar que choquen,
fuerzan el orden peligroso con dos sesiones de base separadas. La sesion A modifica el
stock sin confirmar (y queda duena del bloqueo de la fila), y la sesion B intenta
hacer lo mismo desde otro hilo. Recien cuando Postgres confirma que B esta esperando
ese bloqueo, A confirma.
"""
import threading
import time

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models.pedido import EstadoPedido, Pedido, PedidoItem
from app.models.producto import Producto
from app.services.pedido_service import StockInsuficiente, cambiar_estado, reservar_stock


def _esperar_a_que_alguien_este_bloqueado(engine, timeout=5):
    limite = time.monotonic() + timeout
    while time.monotonic() < limite:
        with engine.connect() as conn:
            esperando = conn.execute(text(
                "SELECT count(*) FROM pg_stat_activity "
                "WHERE datname = current_database() AND wait_event_type = 'Lock'"
            )).scalar()
        if esperando:
            return
        time.sleep(0.01)
    raise AssertionError("Ninguna sesion quedo esperando un bloqueo: el test no llego a forzar la carrera")


def _en_otro_hilo(funcion):
    resultado = {}

    def _correr():
        try:
            resultado["valor"] = funcion()
        except Exception as error:  # se inspecciona despues en el hilo principal
            resultado["error"] = error

    hilo = threading.Thread(target=_correr)
    hilo.start()
    return hilo, resultado


def test_dos_compras_simultaneas_por_la_ultima_unidad(db_session, producto):
    producto.stock = 1
    db_session.commit()
    engine = db_session.get_bind()
    compra_a, compra_b = Session(bind=engine), Session(bind=engine)

    try:
        reservar_stock(compra_a, {producto.id: 1})  # A reserva la ultima unidad, sin confirmar

        def compra_b_intenta():
            reservar_stock(compra_b, {producto.id: 1})
            compra_b.commit()

        hilo, resultado_b = _en_otro_hilo(compra_b_intenta)
        _esperar_a_que_alguien_este_bloqueado(engine)  # B quedo esperando a que A termine
        compra_a.commit()
        hilo.join(timeout=10)
    finally:
        compra_a.rollback()
        compra_b.rollback()
        compra_a.close()
        compra_b.close()

    assert isinstance(resultado_b.get("error"), StockInsuficiente), "La segunda compra no deberia haberse concretado"
    db_session.expire_all()
    assert db_session.get(Producto, producto.id).stock == 0


def test_cancelar_mientras_alguien_compra_no_pisa_la_compra(db_session, producto):
    producto.stock = 5
    pedido = Pedido(
        estado=EstadoPedido.CONFIRMADO, nombre_contacto="X", email_contacto="x@x.com",
        telefono_contacto="1", direccion_envio="X", total=10000,
        items=[PedidoItem(producto_id=producto.id, cantidad=2, precio_unitario=5000)],
    )
    db_session.add(pedido)
    db_session.commit()
    engine = db_session.get_bind()
    compra, cancelacion = Session(bind=engine), Session(bind=engine)

    try:
        reservar_stock(compra, {producto.id: 1})  # alguien compra 1 unidad, sin confirmar todavia

        def cancelacion_en_curso():
            cambiar_estado(cancelacion, cancelacion.get(Pedido, pedido.id), EstadoPedido.CANCELADO)
            cancelacion.commit()

        hilo, resultado = _en_otro_hilo(cancelacion_en_curso)
        _esperar_a_que_alguien_este_bloqueado(engine)
        compra.commit()
        hilo.join(timeout=10)
    finally:
        compra.rollback()
        cancelacion.rollback()
        compra.close()
        cancelacion.close()

    assert "error" not in resultado, resultado.get("error")
    db_session.expire_all()
    assert db_session.get(Producto, producto.id).stock == 6  # 5 - 1 comprada + 2 devueltas
