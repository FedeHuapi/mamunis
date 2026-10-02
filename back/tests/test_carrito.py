from app.models.producto import Variante


def test_crear_carrito(client):
    respuesta = client.post("/carrito/")

    assert respuesta.status_code == 201
    assert "session_id" in respuesta.json()


def test_agregar_item_carrito(client, variante):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]

    respuesta = client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 2})

    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["total"] == "10000.00"
    assert datos["items"][0]["cantidad"] == 2


def test_agregar_item_stock_insuficiente(client, variante):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]

    respuesta = client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 999})

    assert respuesta.status_code == 422


def test_actualizar_cantidad_item(client, variante):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]
    item = client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 1}).json()["items"][0]

    respuesta = client.patch(f"/carrito/{session_id}/items/{item['id']}", json={"cantidad": 3})

    assert respuesta.status_code == 200
    assert respuesta.json()["cantidad"] == 3


def _carrito_de_victima_y_atacante(client, variante):
    victima = client.post("/carrito/").json()["session_id"]
    item_victima = client.post(
        f"/carrito/{victima}/items", json={"variante_id": variante.id, "cantidad": 1}
    ).json()["items"][0]
    atacante = client.post("/carrito/").json()["session_id"]
    return victima, item_victima, atacante


def test_no_se_puede_modificar_item_de_otro_carrito(client, variante):
    victima, item_victima, atacante = _carrito_de_victima_y_atacante(client, variante)

    respuesta = client.patch(f"/carrito/{atacante}/items/{item_victima['id']}", json={"cantidad": 5})

    assert respuesta.status_code == 404
    carrito_victima = client.get(f"/carrito/{victima}").json()
    assert carrito_victima["items"][0]["cantidad"] == 1


def test_no_se_puede_eliminar_item_de_otro_carrito(client, variante):
    victima, item_victima, atacante = _carrito_de_victima_y_atacante(client, variante)

    respuesta = client.delete(f"/carrito/{atacante}/items/{item_victima['id']}")

    assert respuesta.status_code == 404
    carrito_victima = client.get(f"/carrito/{victima}").json()
    assert len(carrito_victima["items"]) == 1


def test_eliminar_item_carrito(client, variante):
    carrito = client.post("/carrito/").json()
    session_id = carrito["session_id"]
    item = client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 1}).json()["items"][0]

    respuesta = client.delete(f"/carrito/{session_id}/items/{item['id']}")
    assert respuesta.status_code == 204

    carrito_actualizado = client.get(f"/carrito/{session_id}").json()
    assert carrito_actualizado["items"] == []


def test_el_item_del_carrito_dice_que_talle_es(client, variante):
    session_id = client.post("/carrito/").json()["session_id"]

    respuesta = client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 1})

    item = respuesta.json()["items"][0]
    assert item["talla"] == "10"
    assert item["variante_id"] == variante.id
    assert item["producto"]["nombre"] == "Remera Dino"


def test_agregar_talle_inexistente_devuelve_404(client):
    session_id = client.post("/carrito/").json()["session_id"]

    respuesta = client.post(f"/carrito/{session_id}/items", json={"variante_id": 999, "cantidad": 1})

    assert respuesta.status_code == 404


def test_dos_talles_del_mismo_producto_son_items_distintos(client, db_session, producto, variante):
    otro_talle = Variante(producto_id=producto.id, talla="12", stock=1)
    db_session.add(otro_talle)
    db_session.commit()
    session_id = client.post("/carrito/").json()["session_id"]
    client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 2})

    respuesta = client.post(f"/carrito/{session_id}/items", json={"variante_id": otro_talle.id, "cantidad": 1})

    datos = respuesta.json()
    assert [(i["talla"], i["cantidad"]) for i in datos["items"]] == [("10", 2), ("12", 1)]
    assert datos["total"] == "15000.00"


def test_el_stock_se_valida_por_talle(client, db_session, producto, variante):
    otro_talle = Variante(producto_id=producto.id, talla="12", stock=1)
    db_session.add(otro_talle)
    db_session.commit()
    session_id = client.post("/carrito/").json()["session_id"]

    respuesta = client.post(f"/carrito/{session_id}/items", json={"variante_id": otro_talle.id, "cantidad": 2})

    assert respuesta.status_code == 422  # el talle 10 tiene 5, pero el 12 tiene solo 1
