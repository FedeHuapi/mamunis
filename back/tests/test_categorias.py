def test_crear_categoria(client):
    respuesta = client.post("/categorias/", json={"nombre": "Remeras", "descripcion": "Remeras de manga corta"})

    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["nombre"] == "Remeras"
    assert "id" in datos


def test_crear_categoria_duplicada(client):
    client.post("/categorias/", json={"nombre": "Remeras"})
    respuesta = client.post("/categorias/", json={"nombre": "Remeras"})

    assert respuesta.status_code == 409


def test_listar_categorias(client):
    client.post("/categorias/", json={"nombre": "Remeras"})
    client.post("/categorias/", json={"nombre": "Pantalones"})

    respuesta = client.get("/categorias/")

    assert respuesta.status_code == 200
    nombres = [c["nombre"] for c in respuesta.json()]
    assert nombres == ["Remeras", "Pantalones"]


def test_obtener_categoria_inexistente(client):
    respuesta = client.get("/categorias/999")

    assert respuesta.status_code == 404
