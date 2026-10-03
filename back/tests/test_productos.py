import pytest
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError

from app.models.categoria import Categoria
from app.models.producto import Producto, Variante


def _datos_producto(categoria, **extra):
    return {"nombre": "Remera Dino", "precio": "5000.00", "categoria_id": categoria.id, **extra}


def test_crear_producto_con_sus_talles(client, categoria, headers_admin):
    respuesta = client.post("/productos/", json=_datos_producto(categoria, variantes=[
        {"talla": "10", "stock": 5},
        {"talla": "12", "stock": 0},
    ]), headers=headers_admin)

    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["nombre"] == "Remera Dino"
    assert [(v["talla"], v["stock"]) for v in datos["variantes"]] == [("10", 5), ("12", 0)]


def test_crear_producto_sin_talles(client, categoria, headers_admin):
    respuesta = client.post("/productos/", json=_datos_producto(categoria), headers=headers_admin)

    assert respuesta.status_code == 201
    assert respuesta.json()["variantes"] == []


def test_crear_producto_rechaza_talle_que_no_existe(client, categoria, headers_admin):
    respuesta = client.post(
        "/productos/", json=_datos_producto(categoria, variantes=[{"talla": "XXL"}]), headers=headers_admin
    )

    assert respuesta.status_code == 422


def test_crear_producto_rechaza_talles_repetidos(client, categoria, headers_admin):
    respuesta = client.post("/productos/", json=_datos_producto(categoria, variantes=[
        {"talla": "10", "stock": 1},
        {"talla": "10", "stock": 2},
    ]), headers=headers_admin)

    assert respuesta.status_code == 422


def test_crear_producto_categoria_inexistente(client, headers_admin):
    respuesta = client.post("/productos/", json={
        "nombre": "Remera Dino",
        "precio": "5000.00",
        "categoria_id": 999,
    }, headers=headers_admin)

    assert respuesta.status_code == 404


def test_listar_productos_filtra_por_categoria(client, producto, db_session):
    otra_categoria = Categoria(nombre="Pantalones")
    db_session.add(otra_categoria)
    db_session.commit()
    db_session.add(Producto(nombre="Jean", precio=8000, categoria_id=otra_categoria.id))
    db_session.commit()

    respuesta = client.get(f"/productos/?categoria_id={producto.categoria_id}")

    nombres = [p["nombre"] for p in respuesta.json()["items"]]
    assert nombres == ["Remera Dino"]


def test_obtener_producto_incluye_sus_talles(client, producto):
    respuesta = client.get(f"/productos/{producto.id}")

    assert respuesta.status_code == 200
    assert [(v["talla"], v["stock"]) for v in respuesta.json()["variantes"]] == [("10", 5)]


def test_actualizar_producto(client, producto, headers_admin):
    respuesta = client.patch(f"/productos/{producto.id}", json={"precio": "6500.00"}, headers=headers_admin)

    assert respuesta.status_code == 200
    assert respuesta.json()["precio"] == "6500.00"


def test_eliminar_producto_borra_sus_talles(client, db_session, producto, headers_admin):
    respuesta = client.delete(f"/productos/{producto.id}", headers=headers_admin)
    assert respuesta.status_code == 204

    assert client.get(f"/productos/{producto.id}").status_code == 404
    assert db_session.query(Variante).count() == 0


def test_no_se_puede_eliminar_producto_que_esta_en_un_carrito(client, producto, variante, headers_admin):
    session_id = client.post("/carrito/").json()["session_id"]
    client.post(f"/carrito/{session_id}/items", json={"variante_id": variante.id, "cantidad": 1})

    respuesta = client.delete(f"/productos/{producto.id}", headers=headers_admin)

    assert respuesta.status_code == 409
    assert client.get(f"/productos/{producto.id}").status_code == 200


def test_agregar_talle_a_un_producto(client, producto, headers_admin):
    respuesta = client.post(
        f"/productos/{producto.id}/variantes", json={"talla": "12", "stock": 3}, headers=headers_admin
    )

    assert respuesta.status_code == 201
    assert respuesta.json()["talla"] == "12"
    tallas = [v["talla"] for v in client.get(f"/productos/{producto.id}").json()["variantes"]]
    assert tallas == ["10", "12"]


def test_agregar_talle_que_el_producto_ya_tiene(client, producto, headers_admin):
    respuesta = client.post(
        f"/productos/{producto.id}/variantes", json={"talla": "10", "stock": 3}, headers=headers_admin
    )

    assert respuesta.status_code == 409


def test_agregar_talle_a_producto_inexistente(client, headers_admin):
    respuesta = client.post("/productos/999/variantes", json={"talla": "10"}, headers=headers_admin)

    assert respuesta.status_code == 404


def test_actualizar_stock_de_un_talle(client, producto, variante, headers_admin):
    respuesta = client.patch(
        f"/productos/{producto.id}/variantes/{variante.id}", json={"stock": 10}, headers=headers_admin
    )

    assert respuesta.status_code == 200
    assert respuesta.json()["stock"] == 10


def test_actualizar_stock_rechaza_negativos(client, producto, variante, headers_admin):
    respuesta = client.patch(
        f"/productos/{producto.id}/variantes/{variante.id}", json={"stock": -1}, headers=headers_admin
    )

    assert respuesta.status_code == 422


def test_no_se_puede_tocar_el_talle_de_otro_producto(client, db_session, producto, variante, headers_admin):
    otro = Producto(nombre="Jean", precio=8000, categoria_id=producto.categoria_id)
    db_session.add(otro)
    db_session.commit()

    respuesta = client.patch(
        f"/productos/{otro.id}/variantes/{variante.id}", json={"stock": 99}, headers=headers_admin
    )

    assert respuesta.status_code == 404


def test_eliminar_talle(client, producto, variante, headers_admin):
    respuesta = client.delete(f"/productos/{producto.id}/variantes/{variante.id}", headers=headers_admin)

    assert respuesta.status_code == 204
    assert client.get(f"/productos/{producto.id}").json()["variantes"] == []


def test_la_base_rechaza_stock_negativo_aunque_se_saltee_la_app(db_session, variante):
    with pytest.raises(IntegrityError):
        db_session.execute(update(Variante).where(Variante.id == variante.id).values(stock=-1))
    db_session.rollback()


def test_la_base_rechaza_el_mismo_talle_dos_veces_en_un_producto(db_session, producto):
    db_session.add(Variante(producto_id=producto.id, talla="10", stock=1))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
