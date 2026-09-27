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


def test_cancelar_pedido_restaura_stock(client, producto):
    session_id = _crear_carrito_con_item(client, producto, cantidad=2)
    pedido = client.post("/pedidos/", json={"session_id": session_id, **DATOS_CONTACTO}).json()

    respuesta = client.post(f"/pedidos/{pedido['id']}/cancelar")

    assert respuesta.status_code == 200
    assert respuesta.json()["estado"] == "cancelado"

    producto_actualizado = client.get(f"/productos/{producto.id}").json()
    assert producto_actualizado["stock"] == 5  # vuelve al original


def test_cancelar_pedido_ya_cancelado(client, producto):
    session_id = _crear_carrito_con_item(client, producto, cantidad=1)
    pedido = client.post("/pedidos/", json={"session_id": session_id, **DATOS_CONTACTO}).json()
    client.post(f"/pedidos/{pedido['id']}/cancelar")

    respuesta = client.post(f"/pedidos/{pedido['id']}/cancelar")

    assert respuesta.status_code == 409


def test_cancelar_pedido_inexistente(client):
    respuesta = client.post("/pedidos/999/cancelar")

    assert respuesta.status_code == 404
