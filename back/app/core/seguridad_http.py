import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

RUTAS_DE_DOCUMENTACION = ("/docs", "/redoc")

HEADERS_DE_SEGURIDAD = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
}
# La API solo devuelve datos: ninguna respuesta necesita cargar ni ejecutar nada.
CONTENT_SECURITY_POLICY = "default-src 'none'; frame-ancestors 'none'"
STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains"


def crear_middleware_de_headers(es_produccion: bool):
    async def agregar_headers_de_seguridad(request: Request, call_next):
        respuesta = await call_next(request)
        respuesta.headers.update(HEADERS_DE_SEGURIDAD)
        # /docs y /redoc son paginas que cargan scripts: con esta politica no funcionarian.
        if not request.url.path.startswith(RUTAS_DE_DOCUMENTACION):
            respuesta.headers["Content-Security-Policy"] = CONTENT_SECURITY_POLICY
        if es_produccion:
            respuesta.headers["Strict-Transport-Security"] = STRICT_TRANSPORT_SECURITY
        return respuesta

    return agregar_headers_de_seguridad


async def error_de_validacion(request: Request, exc: RequestValidationError) -> JSONResponse:
    # La respuesta por defecto incluye "input", que repite lo que mando el cliente
    # (por ejemplo, una contrasena demasiado corta).
    errores = [{"loc": error["loc"], "msg": error["msg"], "type": error["type"]} for error in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errores})


async def error_inesperado(request: Request, exc: Exception) -> JSONResponse:
    # Hacia afuera el mensaje es generico; el detalle queda en los logs.
    logger.error("Error inesperado en %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
