import pytest
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError

from app.models.categoria import Categoria
from app.models.producto import Producto, Talla


def test_crear_producto(client, categoria, headers_admin):
    respuesta = client.post("/productos/", json={
        "nombre": "Remera Dino",
        "precio": "5000.00",
        "talla": "4",
        "categoria_id": categoria.id,
        "stock": 5,
    }, headers=headers_admin)

    assert respuesta.status_code == 201
    assert respuesta.json()["nombre"] == "Remera Dino"


def test_crear_producto_categoria_inexistente(client, headers_admin):
    respuesta = client.post("/productos/", json={
        "nombre": "Remera Dino",
        "precio": "5000.00",
        "talla": "4",
        "categoria_id": 999,
        "stock": 5,
    }, headers=headers_admin)

    assert respuesta.status_code == 404


def test_listar_productos_filtra_por_categoria(client, producto, db_session):
    otra_categoria = Categoria(nombre="Pantalones")
    db_session.add(otra_categoria)
    db_session.commit()
    db_session.add(Producto(nombre="Jean", precio=8000, talla=Talla.T6, categoria_id=otra_categoria.id, stock=2))
    db_session.commit()

    respuesta = client.get(f"/productos/?categoria_id={producto.categoria_id}")

    nombres = [p["nombre"] for p in respuesta.json()]
    assert nombres == ["Remera Dino"]


def test_actualizar_producto(client, producto, headers_admin):
    respuesta = client.patch(f"/productos/{producto.id}", json={"stock": 10}, headers=headers_admin)

    assert respuesta.status_code == 200
    assert respuesta.json()["stock"] == 10


def test_eliminar_producto(client, producto, headers_admin):
    respuesta = client.delete(f"/productos/{producto.id}", headers=headers_admin)
    assert respuesta.status_code == 204

    respuesta = client.get(f"/productos/{producto.id}")
    assert respuesta.status_code == 404


def test_la_base_rechaza_stock_negativo_aunque_se_saltee_la_app(db_session, producto):
    with pytest.raises(IntegrityError):
        db_session.execute(update(Producto).where(Producto.id == producto.id).values(stock=-1))
    db_session.rollback()
