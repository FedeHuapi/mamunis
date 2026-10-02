import logging

import pytest
from fastapi.testclient import TestClient

from app.services.imagenes import ErrorAlSubirImagen, get_almacen_de_imagenes
from main import app, crear_app

EMAIL = "fede@mamunis.com"
PASSWORD = "claveSegura123"
DATOS_CONTACTO = {
    "nombre_contacto": "Cliente",
    "email_contacto": "cliente@mamunis.com",
    "telefono_contacto": "1122334455",
    "direccion_envio": "Calle Falsa 123",
}


@pytest.fixture()
def logs(caplog):
    caplog.set_level(logging.INFO, logger="app")
    return caplog


def _mensajes(logs, nivel=None):
    return [r.getMessage() for r in logs.records if r.name.startswith("app") and nivel in (None, r.levelname)]


def test_login_fallido_queda_registrado_sin_la_password(client, logs):
    client.post("/usuarios/login", json={"email": EMAIL, "password": "claveQueProbeYNoEra"})

    assert _mensajes(logs, "WARNING") == [f"Login fallido: email='{EMAIL}' ip=testclient"]
    assert "claveQueProbeYNoEra" not in logs.text


def test_login_correcto_queda_registrado_sin_la_password_ni_el_token(client, logs):
    usuario = client.post("/usuarios/", json={"nombre": "Fede", "email": EMAIL, "password": PASSWORD}).json()

    token = client.post("/usuarios/login", json={"email": EMAIL, "password": PASSWORD}).json()["access_token"]

    assert f"Login correcto: usuario {usuario['id']} ip=testclient" in _mensajes(logs, "INFO")
    assert PASSWORD not in logs.text
    assert token not in logs.text


def test_login_bloqueado_queda_registrado(client, logs):
    for _ in range(6):
        client.post("/usuarios/login", json={"email": EMAIL, "password": "claveIncorrecta"})

    assert _mensajes(logs, "WARNING")[-1] == f"Login bloqueado por demasiados intentos: email='{EMAIL}' ip=testclient"


def test_las_acciones_del_admin_quedan_registradas(client, logs, categoria, usuario_admin, headers_admin):
    client.post("/productos/", json={"nombre": "Remera", "precio": "5000.00", "categoria_id": categoria.id}, headers=headers_admin)

    assert f"Admin {usuario_admin.id}: POST /productos/" in _mensajes(logs, "INFO")


def test_las_consultas_del_admin_no_se_registran(client, logs, headers_admin):
    client.get("/pedidos/", headers=headers_admin)

    assert _mensajes(logs) == []


def test_intento_de_un_cliente_de_usar_un_endpoint_de_admin_queda_registrado(client, logs, usuario_cliente, headers_cliente):
    client.delete("/productos/1", headers=headers_cliente)

    assert _mensajes(logs, "WARNING") == [f"Acceso denegado: usuario {usuario_cliente.id} intento DELETE /productos/1"]


def test_pedido_creado_y_cambio_de_estado_quedan_registrados(client, logs, variante, headers_admin):
    session_id = client.post("/carrito/").json()["session_id"]
    client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 2})

    pedido = client.post("/pedidos/", json={"session_id": session_id, **DATOS_CONTACTO}).json()
    client.patch(f"/pedidos/{pedido['id']}/estado", json={"estado": "confirmado"}, headers=headers_admin)

    mensajes = _mensajes(logs, "INFO")
    assert f"Pedido {pedido['id']} creado: total=10000.00 items=1 usuario=invitado" in mensajes
    assert f"Pedido {pedido['id']}: pendiente -> confirmado" in mensajes
    assert DATOS_CONTACTO["email_contacto"] not in logs.text  # sin datos personales del comprador


def test_si_falla_la_subida_de_imagen_el_motivo_queda_en_los_logs(client, logs, producto, headers_admin):
    class AlmacenQueFalla:
        def subir(self, contenido, nombre):
            raise ErrorAlSubirImagen("Error 401 - unknown api_key")

    app.dependency_overrides[get_almacen_de_imagenes] = lambda: AlmacenQueFalla()

    respuesta = client.post(
        f"/productos/{producto.id}/imagen",
        files={"archivo": ("foto.jpg", b"\xff\xd8\xff\xe0" + b"\x00" * 32, "image/jpeg")},
        headers=headers_admin,
    )

    assert "unknown api_key" not in respuesta.text  # hacia afuera, generico
    assert _mensajes(logs, "ERROR") == [
        f"No se pudo subir la imagen del producto {producto.id}: Error 401 - unknown api_key"
    ]


def test_un_error_inesperado_queda_registrado_con_su_detalle(logs):
    app_de_prueba = crear_app()

    @app_de_prueba.get("/explota")
    def explota():
        raise RuntimeError("detalle interno")

    respuesta = TestClient(app_de_prueba, raise_server_exceptions=False).get("/explota")

    assert "detalle interno" not in respuesta.text
    registro = next(r for r in logs.records if r.levelname == "ERROR")
    assert registro.getMessage() == "Error inesperado en GET /explota"
    assert "RuntimeError: detalle interno" in logs.text  # el traceback completo
