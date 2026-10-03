import pytest

from app.models.categoria import Categoria
from app.models.producto import Producto, Variante

LISTADOS_PUBLICOS = ["/productos/", "/categorias/"]
PARAMETROS_INVALIDOS = ["limit=100000", "limit=0", "skip=-1"]


@pytest.mark.parametrize("parametros", PARAMETROS_INVALIDOS)
@pytest.mark.parametrize("ruta", LISTADOS_PUBLICOS)
def test_listado_rechaza_paginacion_invalida(client, ruta, parametros):
    respuesta = client.get(f"{ruta}?{parametros}")

    assert respuesta.status_code == 422


@pytest.mark.parametrize("ruta", LISTADOS_PUBLICOS)
def test_listado_acepta_el_maximo(client, ruta):
    respuesta = client.get(f"{ruta}?limit=100")

    assert respuesta.status_code == 200


def _crear_productos(db_session, categoria, cantidad):
    db_session.add_all([
        Producto(
            nombre=f"Remera {i}", precio=1000, categoria_id=categoria.id,
            variantes=[Variante(talla="10", stock=1), Variante(talla="12", stock=1)],
        )
        for i in range(cantidad)
    ])
    db_session.commit()


def test_listado_devuelve_la_pagina_y_el_total(client, db_session, categoria):
    _crear_productos(db_session, categoria, 5)

    datos = client.get("/productos/?skip=2&limit=2").json()

    assert datos["total"] == 5  # todos, no solo los de esta pagina
    assert [p["nombre"] for p in datos["items"]] == ["Remera 2", "Remera 3"]


def test_el_total_respeta_los_filtros(client, db_session, categoria):
    _crear_productos(db_session, categoria, 3)
    otra = Categoria(nombre="Pantalones")
    db_session.add(otra)
    db_session.commit()
    db_session.add(Producto(nombre="Jean", precio=8000, categoria_id=otra.id))
    db_session.commit()

    assert client.get("/productos/").json()["total"] == 4
    assert client.get(f"/productos/?categoria_id={categoria.id}").json()["total"] == 3
    assert client.get(f"/productos/?categoria_id={otra.id}&limit=1").json()["total"] == 1


def test_pagina_fuera_de_rango_devuelve_items_vacios_y_el_total(client, db_session, categoria):
    _crear_productos(db_session, categoria, 2)

    assert client.get("/productos/?skip=50").json() == {"total": 2, "items": []}


@pytest.mark.parametrize("ruta", LISTADOS_PUBLICOS)
def test_listado_vacio(client, ruta):
    assert client.get(ruta).json() == {"total": 0, "items": []}


def test_listado_de_categorias_tiene_total(client, db_session):
    db_session.add_all([Categoria(nombre=f"Categoria {i}") for i in range(3)])
    db_session.commit()

    datos = client.get("/categorias/?limit=2").json()

    assert datos["total"] == 3
    assert len(datos["items"]) == 2


def test_listado_de_pedidos_del_admin_tiene_total(client, variante, headers_admin):
    for _ in range(3):
        session_id = client.post("/carrito/").json()["session_id"]
        client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 1})
        client.post("/pedidos/", json={
            "session_id": session_id, "nombre_contacto": "X", "email_contacto": "x@mamunis.com",
            "telefono_contacto": "1", "direccion_envio": "X",
        })

    datos = client.get("/pedidos/?limit=2", headers=headers_admin).json()

    assert datos["total"] == 3
    assert len(datos["items"]) == 2
