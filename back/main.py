from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import carrito, categorias, pedido, productos, usuario

app = FastAPI(
    title="Mamunis API",
    description="Backend para tienda online de ropa infantil",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(carrito.router)
app.include_router(usuario.router)
app.include_router(pedido.router)


@app.get("/")
def root():
    return {"mensaje": "Bienvenido a la API de Mamunis"}
