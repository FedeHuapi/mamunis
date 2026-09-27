def test_registro_usuario(client):
    respuesta = client.post("/usuarios/", json={
        "nombre": "Federico",
        "email": "fede@mamunis.com",
        "password": "claveSegura123",
    })

    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["email"] == "fede@mamunis.com"
    assert "password" not in datos
    assert "password_hash" not in datos


def test_registro_email_duplicado(client):
    datos = {"nombre": "Federico", "email": "fede@mamunis.com", "password": "claveSegura123"}
    client.post("/usuarios/", json=datos)

    respuesta = client.post("/usuarios/", json=datos)

    assert respuesta.status_code == 409


def test_login_correcto(client):
    client.post("/usuarios/", json={"nombre": "Federico", "email": "fede@mamunis.com", "password": "claveSegura123"})

    respuesta = client.post("/usuarios/login", json={"email": "fede@mamunis.com", "password": "claveSegura123"})

    assert respuesta.status_code == 200


def test_login_password_incorrecta(client):
    client.post("/usuarios/", json={"nombre": "Federico", "email": "fede@mamunis.com", "password": "claveSegura123"})

    respuesta = client.post("/usuarios/login", json={"email": "fede@mamunis.com", "password": "otraClave"})

    assert respuesta.status_code == 401


def test_login_email_inexistente(client):
    respuesta = client.post("/usuarios/login", json={"email": "nadie@mamunis.com", "password": "algo"})

    assert respuesta.status_code == 401
