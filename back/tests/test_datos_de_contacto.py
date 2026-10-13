import pytest

from app.schemas.pedido import numero_nacional

DATOS_CONTACTO = {
    "nombre_contacto": "Federico",
    "email_contacto": "fede@mamunis.com",
    "telefono_contacto": "11 2345-6789",
    "direccion_envio": "Calle Falsa 123",
}


@pytest.mark.parametrize(
    ("escrito", "esperado"),
    [
        ("1123456789", "1123456789"),
        ("11 2345-6789", "1123456789"),
        ("+54 9 11 2345-6789", "1123456789"),
        ("(011) 4123-4567", "1141234567"),
        ("011 15 2345 6789", "1123456789"),
        ("0351 15 234 5678", "3512345678"),
        ("+54 2944 123456", "2944123456"),
        ("02944 15 123456", "2944123456"),
    ],
)
def test_numero_nacional_entiende_las_formas_usuales(escrito, esperado):
    assert numero_nacional(escrito) == esperado


@pytest.mark.parametrize(
    "escrito",
    [
        "123456789",  # 9 digitos y sin caracteristica real
        "1234567890",  # 10 digitos, pero ninguna caracteristica empieza con 12
        "15 2345 6789",  # celular sin caracteristica
        "2345 6789",  # numero sin caracteristica
        "1111111111",
        "no tengo",
        "",
        "11 2345 6789 0000",
    ],
)
def test_numero_nacional_rechaza_lo_que_no_es_un_telefono(escrito):
    assert numero_nacional(escrito) is None


def _pedir(client, producto, **cambios):
    session_id = client.post("/carrito/").json()["session_id"]
    client.post(f"/carrito/{session_id}/items", json={"variante_id": producto.variantes[0].id, "cantidad": 1})
    return client.post("/pedidos/", json={"session_id": session_id, **DATOS_CONTACTO, **cambios})


def _stock(client, producto):
    return client.get(f"/productos/{producto.id}").json()["variantes"][0]["stock"]


@pytest.mark.parametrize(
    "cambios",
    [
        {"telefono_contacto": "123456789"},
        {"telefono_contacto": ""},
        {"telefono_contacto": "   "},
        {"direccion_envio": "123456"},
        {"direccion_envio": "asdf"},
        {"direccion_envio": "   "},
        {"direccion_envio": "Calle Falsa 123 " + "a" * 300},
        {"nombre_contacto": ""},
        {"nombre_contacto": "123"},
    ],
)
def test_checkout_rechaza_datos_de_contacto_que_no_sirven(client, producto, cambios):
    stock_antes = _stock(client, producto)

    respuesta = _pedir(client, producto, **cambios)

    assert respuesta.status_code == 422
    assert _stock(client, producto) == stock_antes


@pytest.mark.parametrize(
    "cambios",
    [
        {"telefono_contacto": "+54 9 351 234-5678"},
        {"direccion_envio": "Ruta 40 km 2000 s/n, Bariloche"},
        {"direccion_envio": "Los Álamos s/n"},
        {"nombre_contacto": "Ñandú Pérez"},
    ],
)
def test_checkout_acepta_datos_de_contacto_validos(client, producto, cambios):
    assert _pedir(client, producto, **cambios).status_code == 201


def test_checkout_guarda_los_datos_sin_espacios_sobrantes(client, producto):
    respuesta = _pedir(client, producto, nombre_contacto="  Federico  ", direccion_envio=" Calle Falsa 123\n")

    pedido = respuesta.json()
    assert pedido["nombre_contacto"] == "Federico"
    assert pedido["direccion_envio"] == "Calle Falsa 123"
