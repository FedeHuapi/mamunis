import re

import pytest

from app.models.arrepentimiento import Arrepentimiento
from app.models.pedido import EstadoPedido, Pedido
from app.routers.arrepentimiento import generar_codigo

DATOS = {"nombre": "Ana Pérez", "email": "ana@ejemplo.com"}


@pytest.fixture()
def pedido_de_ana(db_session):
    pedido = Pedido(
        estado=EstadoPedido.ENTREGADO,
        nombre_contacto="Ana Pérez",
        email_contacto="Ana@Ejemplo.com",
        telefono_contacto="1123456789",
        direccion_envio="Calle Falsa 123",
        total=10000,
    )
    db_session.add(pedido)
    db_session.commit()
    return pedido


def _guardada(db_session, codigo):
    return db_session.query(Arrepentimiento).filter(Arrepentimiento.codigo == codigo).one()


def test_se_puede_pedir_sin_cuenta_y_devuelve_un_codigo(client, db_session):
    respuesta = client.post("/arrepentimientos/", json=DATOS)

    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert re.fullmatch(r"ARR-[A-Z2-9]{8}", cuerpo["codigo"])
    assert set(cuerpo) == {"codigo", "fecha_creacion"}
    assert _guardada(db_session, cuerpo["codigo"]).estado.value == "recibida"


def test_los_codigos_no_son_correlativos():
    codigos = {generar_codigo() for _ in range(200)}
    assert len(codigos) == 200
    assert not any(caracter in "".join(codigos)[4:] for caracter in "O0I1L")


def test_con_numero_y_email_que_coinciden_queda_vinculada_al_pedido(client, db_session, pedido_de_ana):
    respuesta = client.post("/arrepentimientos/", json={**DATOS, "numero_pedido": pedido_de_ana.id, "email": "ANA@ejemplo.com"})

    assert _guardada(db_session, respuesta.json()["codigo"]).pedido_id == pedido_de_ana.id


@pytest.mark.parametrize(
    ("email", "corrimiento"),
    [
        ("otra@ejemplo.com", 0),  # el pedido existe, pero es de otra persona
        ("ana@ejemplo.com", 999),  # el email es el de Ana, pero ese pedido no existe
    ],
)
def test_si_no_coincide_no_se_vincula_y_la_respuesta_es_igual(client, db_session, pedido_de_ana, email, corrimiento):
    numero = pedido_de_ana.id + corrimiento

    respuesta = client.post("/arrepentimientos/", json={**DATOS, "email": email, "numero_pedido": numero})

    # Misma respuesta que cuando coincide: no deja averiguar si un pedido existe ni de quien es.
    assert respuesta.status_code == 201
    assert set(respuesta.json()) == {"codigo", "fecha_creacion"}
    guardada = _guardada(db_session, respuesta.json()["codigo"])
    assert guardada.pedido_id is None
    assert guardada.numero_pedido == numero  # se guarda lo que escribio, para revisarlo a mano


def test_los_campos_opcionales_vacios_se_guardan_como_vacios(client, db_session):
    respuesta = client.post("/arrepentimientos/", json={**DATOS, "telefono": "  ", "numero_pedido": "", "motivo": ""})

    assert respuesta.status_code == 201
    guardada = _guardada(db_session, respuesta.json()["codigo"])
    assert (guardada.telefono, guardada.numero_pedido, guardada.motivo) == (None, None, None)


@pytest.mark.parametrize(
    "cambios",
    [
        {"nombre": ""},
        {"nombre": "123"},
        {"email": "no-es-un-email"},
        {"telefono": "123"},
        {"numero_pedido": 0},
        {"numero_pedido": "abc"},
        {"motivo": "a" * 1001},
    ],
)
def test_rechaza_datos_invalidos(client, cambios):
    assert client.post("/arrepentimientos/", json={**DATOS, **cambios}).status_code == 422


def test_limita_las_solicitudes_por_ip(client):
    for _ in range(5):
        assert client.post("/arrepentimientos/", json=DATOS).status_code == 201

    respuesta = client.post("/arrepentimientos/", json=DATOS)

    assert respuesta.status_code == 429
    assert int(respuesta.headers["Retry-After"]) > 0


def test_el_admin_las_ve_con_el_pedido_vinculado(client, pedido_de_ana, headers_admin):
    client.post("/arrepentimientos/", json={**DATOS, "numero_pedido": pedido_de_ana.id, "motivo": "No me quedó"})
    client.post("/arrepentimientos/", json={**DATOS, "nombre": "Beto Gómez"})

    respuesta = client.get("/arrepentimientos/", headers=headers_admin)

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 2
    mas_nueva, mas_vieja = cuerpo["items"]
    assert mas_nueva["nombre"] == "Beto Gómez" and mas_nueva["pedido"] is None
    assert mas_vieja["pedido"]["id"] == pedido_de_ana.id
    assert mas_vieja["pedido"]["estado"] == "entregado"
    assert mas_vieja["motivo"] == "No me quedó"


def test_el_admin_cambia_el_estado_y_filtra_por_estado(client, headers_admin):
    codigo = client.post("/arrepentimientos/", json=DATOS).json()["codigo"]
    client.post("/arrepentimientos/", json=DATOS)
    solicitud = next(s for s in client.get("/arrepentimientos/", headers=headers_admin).json()["items"] if s["codigo"] == codigo)

    respuesta = client.patch(f"/arrepentimientos/{solicitud['id']}/estado", json={"estado": "resuelta"}, headers=headers_admin)

    assert respuesta.status_code == 200
    assert respuesta.json()["estado"] == "resuelta"
    resueltas = client.get("/arrepentimientos/", params={"estado": "resuelta"}, headers=headers_admin).json()
    assert [s["codigo"] for s in resueltas["items"]] == [codigo]


def test_cambiar_estado_de_una_que_no_existe(client, headers_admin):
    respuesta = client.patch("/arrepentimientos/999/estado", json={"estado": "resuelta"}, headers=headers_admin)

    assert respuesta.status_code == 404
