from app.core.security import leer_usuario_id_del_token
from app.models.usuario import Usuario


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


def test_registro_no_permite_hacerse_admin(client, db_session):
    respuesta = client.post("/usuarios/", json={
        "nombre": "Atacante",
        "email": "atacante@mamunis.com",
        "password": "claveSegura123",
        "es_admin": True,
    })

    assert respuesta.status_code == 201
    usuario = db_session.get(Usuario, respuesta.json()["id"])
    assert usuario.es_admin is False


def test_registro_email_duplicado(client):
    datos = {"nombre": "Federico", "email": "fede@mamunis.com", "password": "claveSegura123"}
    client.post("/usuarios/", json=datos)

    respuesta = client.post("/usuarios/", json=datos)

    assert respuesta.status_code == 409


def test_login_correcto_devuelve_token_del_usuario(client):
    usuario = client.post("/usuarios/", json={
        "nombre": "Federico", "email": "fede@mamunis.com", "password": "claveSegura123",
    }).json()

    respuesta = client.post("/usuarios/login", json={"email": "fede@mamunis.com", "password": "claveSegura123"})

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["token_type"] == "bearer"
    assert leer_usuario_id_del_token(datos["access_token"]) == usuario["id"]


def test_login_password_incorrecta(client):
    client.post("/usuarios/", json={"nombre": "Federico", "email": "fede@mamunis.com", "password": "claveSegura123"})

    respuesta = client.post("/usuarios/login", json={"email": "fede@mamunis.com", "password": "otraClave"})

    assert respuesta.status_code == 401


def test_login_email_inexistente(client):
    respuesta = client.post("/usuarios/login", json={"email": "nadie@mamunis.com", "password": "algo"})

    assert respuesta.status_code == 401
