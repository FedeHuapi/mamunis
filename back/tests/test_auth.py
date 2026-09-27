from app.core.security import crear_token_acceso


def test_me_sin_token_devuelve_401(client):
    respuesta = client.get("/usuarios/me")

    assert respuesta.status_code == 401


def test_me_con_token_invalido_devuelve_401(client):
    respuesta = client.get("/usuarios/me", headers={"Authorization": "Bearer esto-no-es-un-token"})

    assert respuesta.status_code == 401


def test_me_con_token_valido_devuelve_el_usuario(client, usuario_cliente, headers_cliente):
    respuesta = client.get("/usuarios/me", headers=headers_cliente)

    assert respuesta.status_code == 200
    assert respuesta.json()["email"] == usuario_cliente.email
    assert respuesta.json()["es_admin"] is False


def test_me_con_token_de_usuario_borrado_devuelve_401(client, db_session, usuario_cliente):
    token = crear_token_acceso(usuario_cliente.id)
    db_session.delete(usuario_cliente)
    db_session.commit()

    respuesta = client.get("/usuarios/me", headers={"Authorization": f"Bearer {token}"})

    assert respuesta.status_code == 401
