from urllib.parse import urlparse

import cloudinary.exceptions
import cloudinary.uploader
from fastapi import HTTPException, status

from app.core.config import settings

TAMANO_MAXIMO = 5 * 1024 * 1024  # 5 MB
FORMATOS_PERMITIDOS = ("jpeg", "png", "webp")
CARPETA = "mamunis/productos"
SEGUNDOS_DE_ESPERA = 20


class ErrorAlSubirImagen(Exception):
    pass


def detectar_formato(contenido: bytes) -> str | None:
    """Reconoce el formato por los primeros bytes del archivo.

    No se confia en el nombre ni en el Content-Type: los dos los elige quien sube el
    archivo, y renombrar virus.exe a foto.jpg es trivial.
    """
    if contenido.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if contenido.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP":
        return "webp"
    return None


class AlmacenCloudinary:
    def __init__(self, cloudinary_url: str):
        url = urlparse(cloudinary_url)
        if url.scheme != "cloudinary" or not (url.hostname and url.username and url.password):
            raise ValueError("CLOUDINARY_URL tiene que tener la forma cloudinary://api_key:api_secret@cloud_name")
        self._credenciales = {"cloud_name": url.hostname, "api_key": url.username, "api_secret": url.password}

    def subir(self, contenido: bytes, nombre: str) -> str:
        """Sube la imagen y devuelve su URL publica. Si ya existe una con ese nombre, la reemplaza."""
        try:
            resultado = cloudinary.uploader.upload(
                contenido,
                folder=CARPETA,
                public_id=nombre,
                overwrite=True,
                invalidate=True,
                resource_type="image",
                allowed_formats=["jpg", "png", "webp"],
                timeout=SEGUNDOS_DE_ESPERA,
                **self._credenciales,
            )
        except (cloudinary.exceptions.Error, OSError) as error:
            raise ErrorAlSubirImagen(str(error)) from error
        return resultado["secure_url"]


def get_almacen_de_imagenes() -> AlmacenCloudinary:
    if not settings.CLOUDINARY_URL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La subida de imágenes no está configurada",
        )
    return AlmacenCloudinary(settings.CLOUDINARY_URL)
