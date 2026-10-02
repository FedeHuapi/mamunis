import cloudinary.exceptions
import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services import imagenes
from app.services.imagenes import (
    TAMANO_MAXIMO,
    AlmacenCloudinary,
    ErrorAlSubirImagen,
    detectar_formato,
    get_almacen_de_imagenes,
)
from main import app

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 32
URL_FALSA = "https://res.cloudinary.com/demo/image/upload/v1/mamunis/productos/producto-1.jpg"


class AlmacenFalso:
    """Reemplaza a Cloudinary en los tests: no sale a internet, solo anota lo que le piden."""

    def __init__(self, falla=False):
        self.subidas = []
        self.falla = falla

    def subir(self, contenido, nombre):
        if self.falla:
            raise ErrorAlSubirImagen("Cloudinary no responde")
        self.subidas.append((contenido, nombre))
        return URL_FALSA


@pytest.fixture()
def almacen(client):
    almacen = AlmacenFalso()
    app.dependency_overrides[get_almacen_de_imagenes] = lambda: almacen
    return almacen


def _subir(client, producto_id, headers, contenido=JPEG, nombre="foto.jpg", tipo="image/jpeg"):
    return client.post(
        f"/productos/{producto_id}/imagen", files={"archivo": (nombre, contenido, tipo)}, headers=headers
    )


@pytest.mark.parametrize("contenido", [JPEG, PNG, WEBP])
def test_subir_imagen_guarda_la_url_en_el_producto(client, almacen, producto, headers_admin, contenido):
    respuesta = _subir(client, producto.id, headers_admin, contenido=contenido)

    assert respuesta.status_code == 200
    assert respuesta.json()["imagen"] == URL_FALSA
    assert client.get(f"/productos/{producto.id}").json()["imagen"] == URL_FALSA
    assert almacen.subidas == [(contenido, f"producto-{producto.id}")]


def test_el_nombre_en_cloudinary_no_depende_del_nombre_del_archivo(client, almacen, producto, headers_admin):
    _subir(client, producto.id, headers_admin, nombre="../../etc/passwd.jpg")

    assert almacen.subidas[0][1] == f"producto-{producto.id}"


def test_rechaza_un_archivo_que_dice_ser_imagen_pero_no_lo_es(client, almacen, producto, headers_admin):
    respuesta = _subir(client, producto.id, headers_admin, contenido=b"MZ\x90\x00 esto es un .exe renombrado")

    assert respuesta.status_code == 415
    assert almacen.subidas == []
    assert client.get(f"/productos/{producto.id}").json()["imagen"] is None


def test_rechaza_imagen_demasiado_pesada(client, almacen, producto, headers_admin):
    respuesta = _subir(client, producto.id, headers_admin, contenido=JPEG + b"\x00" * TAMANO_MAXIMO)

    assert respuesta.status_code == 413
    assert almacen.subidas == []


def test_subir_imagen_a_producto_inexistente(client, almacen, headers_admin):
    assert _subir(client, 999, headers_admin).status_code == 404


def test_subir_imagen_requiere_admin(client, almacen, producto, headers_cliente):
    assert _subir(client, producto.id, headers_cliente).status_code == 403
    assert almacen.subidas == []


def test_si_cloudinary_falla_responde_502_y_no_cambia_el_producto(client, producto, headers_admin):
    app.dependency_overrides[get_almacen_de_imagenes] = lambda: AlmacenFalso(falla=True)

    respuesta = _subir(client, producto.id, headers_admin)

    assert respuesta.status_code == 502
    assert "Cloudinary" not in respuesta.text
    assert client.get(f"/productos/{producto.id}").json()["imagen"] is None


def test_sin_configurar_cloudinary_responde_503(monkeypatch):
    monkeypatch.setattr(settings, "CLOUDINARY_URL", None)

    with pytest.raises(HTTPException) as error:
        get_almacen_de_imagenes()

    assert error.value.status_code == 503


@pytest.mark.parametrize("contenido,esperado", [
    (JPEG, "jpeg"),
    (PNG, "png"),
    (WEBP, "webp"),
    (b"GIF89a" + b"\x00" * 32, None),
    (b"<svg onload=alert(1)>", None),
    (b"RIFF\x24\x00\x00\x00WAVEfmt ", None),
    (b"", None),
])
def test_detectar_formato(contenido, esperado):
    assert detectar_formato(contenido) == esperado


def test_almacen_rechaza_una_url_mal_formada():
    with pytest.raises(ValueError):
        AlmacenCloudinary("https://cloudinary.com/mi-cuenta")


def test_almacen_sube_con_las_credenciales_y_devuelve_la_url_segura(monkeypatch):
    llamadas = []

    def upload_falso(contenido, **opciones):
        llamadas.append((contenido, opciones))
        return {"secure_url": URL_FALSA}

    monkeypatch.setattr(imagenes.cloudinary.uploader, "upload", upload_falso)

    url = AlmacenCloudinary("cloudinary://clave:secreto@mi-nube").subir(JPEG, "producto-7")

    assert url == URL_FALSA
    contenido, opciones = llamadas[0]
    assert contenido == JPEG
    assert opciones["cloud_name"] == "mi-nube"
    assert opciones["api_key"] == "clave"
    assert opciones["api_secret"] == "secreto"
    assert opciones["public_id"] == "producto-7"
    assert opciones["resource_type"] == "image"


def test_almacen_convierte_los_errores_de_cloudinary(monkeypatch):
    def upload_que_falla(contenido, **opciones):
        raise cloudinary.exceptions.Error("Invalid image file")

    monkeypatch.setattr(imagenes.cloudinary.uploader, "upload", upload_que_falla)

    with pytest.raises(ErrorAlSubirImagen):
        AlmacenCloudinary("cloudinary://clave:secreto@mi-nube").subir(JPEG, "producto-7")
