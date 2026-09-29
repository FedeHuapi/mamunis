import pytest

EMAIL = "fede@mamunis.com"
PASSWORD = "claveSegura123"


@pytest.fixture()
def cuenta(client):
    client.post("/usuarios/", json={"nombre": "Fede", "email": EMAIL, "password": PASSWORD})


def _login(client, email=EMAIL, password="claveIncorrecta"):
    return client.post("/usuarios/login", json={"email": email, "password": password})


def test_despues_de_5_fallos_bloquea_con_429(client, cuenta):
    for _ in range(5):
        assert _login(client).status_code == 401

    respuesta = _login(client)

    assert respuesta.status_code == 429
    assert int(respuesta.headers["Retry-After"]) > 0


def test_bloqueado_ni_siquiera_la_password_correcta_entra(client, cuenta):
    for _ in range(5):
        _login(client)

    respuesta = _login(client, password=PASSWORD)

    assert respuesta.status_code == 429


def test_un_login_correcto_reinicia_el_contador(client, cuenta):
    for _ in range(4):
        _login(client)
    assert _login(client, password=PASSWORD).status_code == 200

    for _ in range(4):
        _login(client)

    assert _login(client, password=PASSWORD).status_code == 200


def test_el_bloqueo_de_una_cuenta_no_afecta_a_otra(client, cuenta):
    client.post("/usuarios/", json={"nombre": "Otra", "email": "otra@mamunis.com", "password": PASSWORD})
    for _ in range(5):
        _login(client)

    assert _login(client, email="otra@mamunis.com", password=PASSWORD).status_code == 200


def test_mayusculas_en_el_email_no_esquivan_el_limite(client, cuenta):
    for variante in ["fede@mamunis.com", "FEDE@mamunis.com", "Fede@mamunis.com", "fEDE@mamunis.com", "FeDe@mamunis.com"]:
        _login(client, email=variante)

    assert _login(client).status_code == 429


def test_muchas_cuentas_distintas_desde_la_misma_ip_se_bloquean(client):
    for i in range(20):
        assert _login(client, email=f"victima{i}@mamunis.com").status_code == 401

    assert _login(client, email="otra-victima@mamunis.com").status_code == 429
