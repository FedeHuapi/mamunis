from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings
from app.core.security import ALGORITMO_JWT, crear_token_acceso, leer_usuario_id_del_token


def test_token_valido_devuelve_el_usuario():
    token = crear_token_acceso(7)

    assert leer_usuario_id_del_token(token) == 7


def test_token_con_contenido_modificado_es_rechazado():
    encabezado, _, firma = crear_token_acceso(7).split(".")
    _, contenido_de_otro_usuario, _ = crear_token_acceso(1).split(".")

    # misma firma, pero el contenido ahora dice "soy el usuario 1"
    token_adulterado = f"{encabezado}.{contenido_de_otro_usuario}.{firma}"

    assert leer_usuario_id_del_token(token_adulterado) is None


def test_token_firmado_con_otra_clave_es_rechazado():
    vencimiento = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = jwt.encode({"sub": "7", "exp": vencimiento}, "una-clave-que-no-es-la-del-servidor-1234567890", algorithm=ALGORITMO_JWT)

    assert leer_usuario_id_del_token(token) is None


def test_token_vencido_es_rechazado():
    vencimiento = datetime.now(timezone.utc) - timedelta(minutes=1)
    token = jwt.encode({"sub": "7", "exp": vencimiento}, settings.SECRET_KEY, algorithm=ALGORITMO_JWT)

    assert leer_usuario_id_del_token(token) is None


def test_token_sin_firma_alg_none_es_rechazado():
    vencimiento = datetime.now(timezone.utc) + timedelta(minutes=5)
    token = jwt.encode({"sub": "7", "exp": vencimiento}, key=None, algorithm="none")

    assert leer_usuario_id_del_token(token) is None


def test_basura_es_rechazada():
    assert leer_usuario_id_del_token("esto-no-es-un-token") is None
