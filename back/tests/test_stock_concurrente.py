from app.models.producto import Variante


def _cambiar_stock(client, producto, variante, headers, **cuerpo):
    return client.patch(f"/productos/{producto.id}/variantes/{variante.id}", json=cuerpo, headers=headers)


def test_guardar_stock_cuando_nadie_lo_cambio(client, producto, variante, headers_admin):
    respuesta = _cambiar_stock(client, producto, variante, headers_admin, stock=10, stock_anterior=variante.stock)

    assert respuesta.status_code == 200
    assert respuesta.json()["stock"] == 10


def test_una_venta_entre_que_se_abre_y_se_guarda_no_se_pisa(client, db_session, producto, variante, headers_admin):
    visto_por_el_admin = variante.stock  # 5
    # Mientras el admin tiene la pantalla abierta, alguien compra 2.
    db_session.query(Variante).filter(Variante.id == variante.id).update({"stock": Variante.stock - 2})
    db_session.commit()

    respuesta = _cambiar_stock(client, producto, variante, headers_admin, stock=10, stock_anterior=visto_por_el_admin)

    assert respuesta.status_code == 409
    assert "3" in respuesta.json()["detail"]  # le dice cuanto hay ahora
    db_session.refresh(variante)
    assert variante.stock == 3  # la venta sigue descontada


def test_guardar_stock_exige_decir_que_valor_se_vio(client, producto, variante, headers_admin):
    respuesta = _cambiar_stock(client, producto, variante, headers_admin, stock=10)

    assert respuesta.status_code == 422
