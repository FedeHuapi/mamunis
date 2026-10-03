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
