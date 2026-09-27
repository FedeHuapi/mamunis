def test_crear_carrito(client):
    respuesta = client.post("/carrito/")

    assert respuesta.status_code == 201
    assert "session_id" in respuesta.json()


def test_agregar_item_carrito(client, producto):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]

    respuesta = client.post(f"/carrito/{session_id}/items", json={"producto_id": producto.id, "cantidad": 2})

    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["total"] == "10000.00"
    assert datos["items"][0]["cantidad"] == 2


def test_agregar_item_stock_insuficiente(client, producto):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]

    respuesta = client.post(f"/carrito/{session_id}/items", json={"producto_id": producto.id, "cantidad": 999})

    assert respuesta.status_code == 422


def test_actualizar_cantidad_item(client, producto):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]
    item = client.post(f"/carrito/{session_id}/items", json={"producto_id": producto.id, "cantidad": 1}).json()["items"][0]

    respuesta = client.patch(f"/carrito/items/{item['id']}", json={"cantidad": 3})

    assert respuesta.status_code == 200
    assert respuesta.json()["cantidad"] == 3


def test_eliminar_item_carrito(client, producto):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]
    item = client.post(f"/carrito/{session_id}/items", json={"producto_id": producto.id, "cantidad": 1}).json()["items"][0]

    respuesta = client.delete(f"/carrito/items/{item['id']}")
    assert respuesta.status_code == 204

    carrito_actualizado = client.get(f"/carrito/{session_id}").json()
    assert carrito_actualizado["items"] == []
