ORIGEN_PERMITIDO = "http://localhost:5173"
ORIGEN_MALICIOSO = "https://sitio-trucho.com"


def _preflight(client, origen):
    return client.options("/productos/", headers={
        "Origin": origen,
        "Access-Control-Request-Method": "GET",
    })


def test_origen_permitido_pasa_el_preflight(client):
    respuesta = _preflight(client, ORIGEN_PERMITIDO)

    assert respuesta.status_code == 200
    assert respuesta.headers["access-control-allow-origin"] == ORIGEN_PERMITIDO


def test_origen_no_permitido_es_rechazado_en_el_preflight(client):
    respuesta = _preflight(client, ORIGEN_MALICIOSO)

    assert respuesta.status_code == 400
    assert "access-control-allow-origin" not in respuesta.headers


def test_request_desde_origen_no_permitido_no_recibe_permiso_cors(client):
    respuesta = client.get("/productos/", headers={"Origin": ORIGEN_MALICIOSO})

    assert "access-control-allow-origin" not in respuesta.headers
