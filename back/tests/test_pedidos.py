from app.models.pedido import EstadoPedido, Pedido

DATOS_CONTACTO = {
    "nombre_contacto": "Federico",
    "email_contacto": "fede@mamunis.com",
    "telefono_contacto": "1122334455",
    "direccion_envio": "Calle Falsa 123",
}


def _crear_carrito_con_item(client, producto, cantidad=2):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]
    client.post(f"/carrito/{session_id}/items", json={"producto_id": producto.id, "cantidad": cantidad})
    return session_id


def test_checkout_completo(client, producto):
    session_id = _crear_carrito_con_item(client, producto, cantidad=2)

    respuesta = client.post("/pedidos/", json={"session_id": session_id, **DATOS_CONTACTO})

    assert respuesta.status_code == 201
    pedido = respuesta.json()
    assert pedido["estado"] == "pendiente"
    assert pedido["total"] == "10000.00"

    producto_actualizado = client.get(f"/productos/{producto.id}").json()
    assert producto_actualizado["stock"] == 3  # 5 - 2

    carrito_vacio = client.get(f"/carrito/{session_id}").json()
    assert carrito_vacio["items"] == []


def test_checkout_carrito_vacio(client):
    carrito = client.post("/carrito/").json()

    respuesta = client.post("/pedidos/", json={"session_id": carrito["session_id"], **DATOS_CONTACTO})

    assert respuesta.status_code == 422


def test_checkout_carrito_inexistente(client):
    respuesta = client.post("/pedidos/", json={
        "session_id": "00000000-0000-0000-0000-000000000000",
        **DATOS_CONTACTO,
    })

    assert respuesta.status_code == 404


def test_checkout_stock_insuficiente(client, producto, db_session):
    session_id = _crear_carrito_con_item(client, producto, cantidad=5)

    # simula que otra persona compro el resto del stock entre que este carrito
    # se armo y el momento del checkout
    producto.stock = 1
    db_session.add(producto)
    db_session.commit()

    respuesta = client.post("/pedidos/", json={"session_id": session_id, **DATOS_CONTACTO})

    assert respuesta.status_code == 422


def _crear_pedido(client, producto, cantidad=2):
    session_id = _crear_carrito_con_item(client, producto, cantidad=cantidad)
    return client.post("/pedidos/", json={"session_id": session_id, **DATOS_CONTACTO}).json()["id"]


def _cambiar_estado(client, pedido_id, estado, headers):
    return client.patch(f"/pedidos/{pedido_id}/estado", json={"estado": estado}, headers=headers)


def test_pedido_recorre_todo_el_flujo_hasta_entregado(client, producto, headers_admin):
    pedido_id = _crear_pedido(client, producto)

    for estado in ["confirmado", "en_preparacion", "enviado", "entregado"]:
        respuesta = _cambiar_estado(client, pedido_id, estado, headers_admin)
        assert respuesta.status_code == 200
        assert respuesta.json()["estado"] == estado


def test_cancelar_pedido_restaura_stock(client, producto, headers_admin):
    pedido_id = _crear_pedido(client, producto, cantidad=2)

    respuesta = _cambiar_estado(client, pedido_id, "cancelado", headers_admin)

    assert respuesta.status_code == 200
    assert respuesta.json()["estado"] == "cancelado"
    assert client.get(f"/productos/{producto.id}").json()["stock"] == 5  # vuelve al original


def test_cancelar_pedido_ya_cancelado(client, producto, headers_admin):
    pedido_id = _crear_pedido(client, producto, cantidad=1)
    _cambiar_estado(client, pedido_id, "cancelado", headers_admin)

    respuesta = _cambiar_estado(client, pedido_id, "cancelado", headers_admin)

    assert respuesta.status_code == 409
    assert client.get(f"/productos/{producto.id}").json()["stock"] == 5  # no se repone dos veces


def test_no_se_puede_cancelar_pedido_entregado(client, producto, db_session, headers_admin):
    pedido_id = _crear_pedido(client, producto, cantidad=2)
    pedido = db_session.get(Pedido, pedido_id)
    pedido.estado = EstadoPedido.ENTREGADO
    db_session.commit()

    respuesta = _cambiar_estado(client, pedido_id, "cancelado", headers_admin)

    assert respuesta.status_code == 409
    assert client.get(f"/productos/{producto.id}").json()["stock"] == 3  # no se "recupera" ropa ya entregada


def test_estado_inexistente_devuelve_422(client, producto, headers_admin):
    pedido_id = _crear_pedido(client, producto)

    respuesta = _cambiar_estado(client, pedido_id, "perdido_en_el_correo", headers_admin)

    assert respuesta.status_code == 422


def test_cambiar_estado_pedido_inexistente(client, headers_admin):
    respuesta = _cambiar_estado(client, 999, "confirmado", headers_admin)

    assert respuesta.status_code == 404
