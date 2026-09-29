import pytest
from fastapi.testclient import TestClient

from main import crear_app


def test_respuestas_incluyen_headers_de_seguridad(client):
    respuesta = client.get("/productos/")

    assert respuesta.headers["X-Content-Type-Options"] == "nosniff"
    assert respuesta.headers["X-Frame-Options"] == "DENY"
    assert respuesta.headers["Referrer-Policy"] == "no-referrer"
    assert "default-src 'none'" in respuesta.headers["Content-Security-Policy"]
    assert "Strict-Transport-Security" not in respuesta.headers  # solo en produccion


def test_docs_funciona_en_desarrollo(client):
    respuesta = client.get("/docs")

    assert respuesta.status_code == 200
    assert "Content-Security-Policy" not in respuesta.headers


@pytest.fixture()
def cliente_produccion():
    return TestClient(crear_app(entorno="produccion"))


@pytest.mark.parametrize("ruta", ["/docs", "/redoc", "/openapi.json"])
def test_documentacion_apagada_en_produccion(cliente_produccion, ruta):
    assert cliente_produccion.get(ruta).status_code == 404


def test_produccion_exige_https(cliente_produccion):
    respuesta = cliente_produccion.get("/")

    assert respuesta.headers["Strict-Transport-Security"].startswith("max-age=")


def test_error_de_validacion_no_repite_lo_que_mando_el_cliente(client):
    respuesta = client.post("/usuarios/", json={
        "nombre": "Fede", "email": "fede@mamunis.com", "password": "Secreta",
    })

    assert respuesta.status_code == 422
    assert "Secreta" not in respuesta.text
    assert respuesta.json()["detail"][0]["loc"] == ["body", "password"]


def test_error_inesperado_responde_generico_sin_detalles():
    app = crear_app()

    @app.get("/explota")
    def explota():
        raise RuntimeError("detalle interno que nadie de afuera deberia ver")

    respuesta = TestClient(app, raise_server_exceptions=False).get("/explota")

    assert respuesta.status_code == 500
    assert respuesta.json() == {"detail": "Error interno del servidor"}
    assert "detalle interno" not in respuesta.text
