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

    respuesta = client.patch(f"/carrito/{session_id}/items/{item['id']}", json={"cantidad": 3})

    assert respuesta.status_code == 200
    assert respuesta.json()["cantidad"] == 3


def _carrito_de_victima_y_atacante(client, producto):
    victima = client.post("/carrito/").json()["session_id"]
    item_victima = client.post(
        f"/carrito/{victima}/items", json={"producto_id": producto.id, "cantidad": 1}
    ).json()["items"][0]
    atacante = client.post("/carrito/").json()["session_id"]
    return victima, item_victima, atacante


def test_no_se_puede_modificar_item_de_otro_carrito(client, producto):
    victima, item_victima, atacante = _carrito_de_victima_y_atacante(client, producto)

    respuesta = client.patch(f"/carrito/{atacante}/items/{item_victima['id']}", json={"cantidad": 5})

    assert respuesta.status_code == 404
    carrito_victima = client.get(f"/carrito/{victima}").json()
    assert carrito_victima["items"][0]["cantidad"] == 1


def test_no_se_puede_eliminar_item_de_otro_carrito(client, producto):
    victima, item_victima, atacante = _carrito_de_victima_y_atacante(client, producto)

    respuesta = client.delete(f"/carrito/{atacante}/items/{item_victima['id']}")

    assert respuesta.status_code == 404
    carrito_victima = client.get(f"/carrito/{victima}").json()
    assert len(carrito_victima["items"]) == 1


def test_eliminar_item_carrito(client, producto):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]
    item = client.post(f"/carrito/{session_id}/items", json={"producto_id": producto.id, "cantidad": 1}).json()["items"][0]

    respuesta = client.delete(f"/carrito/{session_id}/items/{item['id']}")
    assert respuesta.status_code == 204

    carrito_actualizado = client.get(f"/carrito/{session_id}").json()
    assert carrito_actualizado["items"] == []
