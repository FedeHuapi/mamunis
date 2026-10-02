import pytest

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
