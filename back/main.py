from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logs import configurar_logs
from app.core.seguridad_http import (
    crear_middleware_de_headers,
    error_de_validacion,
    error_inesperado,
)
from app.routers import carrito, categorias, pedido, productos, usuario


def crear_app(entorno: str = settings.ENTORNO) -> FastAPI:
    es_produccion = entorno == "produccion"
    configurar_logs(settings.LOG_LEVEL)

    app = FastAPI(
        title="Mamunis API",
        description="Backend para tienda online de ropa infantil",
        version="0.2.0",
        docs_url=None if es_produccion else "/docs",
        redoc_url=None if es_produccion else "/redoc",
        openapi_url=None if es_produccion else "/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.middleware("http")(crear_middleware_de_headers(es_produccion))

    app.add_exception_handler(RequestValidationError, error_de_validacion)
    app.add_exception_handler(Exception, error_inesperado)

    app.include_router(categorias.router)
    app.include_router(productos.router)
    app.include_router(carrito.router)
    app.include_router(usuario.router)
    app.include_router(pedido.router)

    @app.get("/")
    def root():
        return {"mensaje": "Bienvenido a la API de Mamunis"}

    return app


app = crear_app()
