from app.core.security import crear_token_acceso
from app.models.producto import Producto
from app.models.usuario import Usuario

DATOS_CONTACTO = {
    "nombre_contacto": "Cliente",
    "email_contacto": "cliente@mamunis.com",
    "telefono_contacto": "1122334455",
    "direccion_envio": "Calle Falsa 123",
}


def _comprar(client, producto, headers=None, email_contacto="cliente@mamunis.com"):
    session_id = client.post("/carrito/").json()["session_id"]
    client.post(f"/carrito/{session_id}/items", json={"producto_id": producto.id, "cantidad": 1})
    datos = {**DATOS_CONTACTO, "email_contacto": email_contacto, "session_id": session_id}
    return client.post("/pedidos/", json=datos, headers=headers or {})


def _mis_pedidos(client, headers):
    return client.get("/usuarios/me/pedidos", headers=headers)


def test_compra_logueado_queda_en_mis_pedidos(client, producto, headers_cliente):
    pedido = _comprar(client, producto, headers=headers_cliente).json()

    respuesta = _mis_pedidos(client, headers_cliente)

    assert respuesta.status_code == 200
    assert [p["id"] for p in respuesta.json()] == [pedido["id"]]


def test_compra_como_invitado_no_queda_en_ninguna_cuenta(client, producto, headers_cliente):
    respuesta = _comprar(client, producto)

    assert respuesta.status_code == 201
    assert _mis_pedidos(client, headers_cliente).json() == []


def test_cada_cliente_ve_solo_sus_pedidos(client, db_session, producto, usuario_cliente, headers_cliente):
    otro = Usuario(nombre="Otro", email="otro@mamunis.com", password_hash="x")
    db_session.add(otro)
    db_session.commit()
    headers_otro = {"Authorization": f"Bearer {crear_token_acceso(otro.id)}"}

    mio = _comprar(client, producto, headers=headers_cliente).json()
    del_otro = _comprar(client, producto, headers=headers_otro).json()

    assert [p["id"] for p in _mis_pedidos(client, headers_cliente).json()] == [mio["id"]]
    assert [p["id"] for p in _mis_pedidos(client, headers_otro).json()] == [del_otro["id"]]


def test_pedidos_de_invitado_no_se_asocian_por_email(client, producto):
    # Sin verificacion de email, cualquiera podria registrarse con el email de otra
    # persona y ver sus pedidos (con direccion y telefono).
    _comprar(client, producto, email_contacto="victima@mamunis.com")
    client.post("/usuarios/", json={"nombre": "Atacante", "email": "victima@mamunis.com", "password": "claveSegura123"})
    token = client.post("/usuarios/login", json={"email": "victima@mamunis.com", "password": "claveSegura123"}).json()

    respuesta = _mis_pedidos(client, {"Authorization": f"Bearer {token['access_token']}"})

    assert respuesta.json() == []


def test_checkout_con_token_invalido_no_compra_nada(client, db_session, producto):
    respuesta = _comprar(client, producto, headers={"Authorization": "Bearer token-vencido-o-trucho"})

    assert respuesta.status_code == 401
    db_session.expire_all()
    assert db_session.get(Producto, producto.id).stock == 5  # no se reservo stock


def test_mis_pedidos_sin_token_devuelve_401(client):
    assert client.get("/usuarios/me/pedidos").status_code == 401


def test_mis_pedidos_rechaza_limit_excesivo(client, headers_cliente):
    assert client.get("/usuarios/me/pedidos?limit=1000", headers=headers_cliente).status_code == 422
