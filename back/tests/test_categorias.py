def test_crear_categoria(client, headers_admin):
    respuesta = client.post("/categorias/", json={"nombre": "Remeras", "descripcion": "Remeras de manga corta"}, headers=headers_admin)

    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["nombre"] == "Remeras"
    assert "id" in datos


def test_crear_categoria_duplicada(client, headers_admin):
    client.post("/categorias/", json={"nombre": "Remeras"}, headers=headers_admin)
    respuesta = client.post("/categorias/", json={"nombre": "Remeras"}, headers=headers_admin)

    assert respuesta.status_code == 409


def test_listar_categorias_es_publico(client, headers_admin):
    client.post("/categorias/", json={"nombre": "Remeras"}, headers=headers_admin)
    client.post("/categorias/", json={"nombre": "Pantalones"}, headers=headers_admin)

    respuesta = client.get("/categorias/")

    assert respuesta.status_code == 200
    nombres = [c["nombre"] for c in respuesta.json()["items"]]
    assert nombres == ["Remeras", "Pantalones"]


def test_obtener_categoria_inexistente(client):
    respuesta = client.get("/categorias/999")

    assert respuesta.status_code == 404


def test_no_se_puede_eliminar_una_categoria_con_productos(client, producto, headers_admin):
    respuesta = client.delete(f"/categorias/{producto.categoria_id}", headers=headers_admin)

    assert respuesta.status_code == 409
    assert "1 producto" in respuesta.json()["detail"]
    assert client.get(f"/productos/{producto.id}").status_code == 200


def test_eliminar_una_categoria_vacia(client, categoria, headers_admin):
    respuesta = client.delete(f"/categorias/{categoria.id}", headers=headers_admin)

    assert respuesta.status_code == 204
    assert client.get(f"/categorias/{categoria.id}").status_code == 404
