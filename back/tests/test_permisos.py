import pytest
from fastapi.routing import APIRoute

from app.core.auth import requerir_admin
from main import app

ENDPOINTS_SOLO_ADMIN = [
    ("POST", "/categorias/"),
    ("PATCH", "/categorias/1"),
    ("DELETE", "/categorias/1"),
    ("POST", "/productos/"),
    ("PATCH", "/productos/1"),
    ("DELETE", "/productos/1"),
    ("GET", "/pedidos/"),
    ("GET", "/pedidos/1"),
    ("PATCH", "/pedidos/1/estado"),
]

# Endpoints de escritura que cualquiera puede usar a proposito (clientes e invitados).
# Si agregas un endpoint de escritura nuevo y no exige admin, tiene que estar aca,
# o test_todo_endpoint_de_escritura_es_admin_o_publico_a_proposito falla.
ESCRITURA_PUBLICA = {
    ("POST", "/carrito/"),
    ("POST", "/carrito/{session_id}/items"),
    ("PATCH", "/carrito/{session_id}/items/{item_id}"),
    ("DELETE", "/carrito/{session_id}/items/{item_id}"),
    ("POST", "/pedidos/"),
    ("POST", "/usuarios/"),
    ("POST", "/usuarios/login"),
}


@pytest.mark.parametrize("metodo,ruta", ENDPOINTS_SOLO_ADMIN)
def test_sin_token_devuelve_401(client, metodo, ruta):
    respuesta = client.request(metodo, ruta, json={})

    assert respuesta.status_code == 401


@pytest.mark.parametrize("metodo,ruta", ENDPOINTS_SOLO_ADMIN)
def test_cliente_no_admin_devuelve_403(client, headers_cliente, metodo, ruta):
    respuesta = client.request(metodo, ruta, json={}, headers=headers_cliente)

    assert respuesta.status_code == 403


def _exige_admin(dependant) -> bool:
    return any(dep.call is requerir_admin or _exige_admin(dep) for dep in dependant.dependencies)


def test_todo_endpoint_de_escritura_es_admin_o_publico_a_proposito():
    sin_proteger = []
    for ruta in app.routes:
        if not isinstance(ruta, APIRoute):
            continue
        for metodo in ruta.methods & {"POST", "PUT", "PATCH", "DELETE"}:
            if (metodo, ruta.path) in ESCRITURA_PUBLICA:
                continue
            if not _exige_admin(ruta.dependant):
                sin_proteger.append(f"{metodo} {ruta.path}")

    assert sin_proteger == [], f"Endpoints de escritura sin proteccion ni marcados como publicos: {sin_proteger}"
