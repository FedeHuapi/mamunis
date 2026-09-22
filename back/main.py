from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.routers import carrito, categorias, productos

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mamunis API",
    description="Backend para tienda online de ropa infantil",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(carrito.router)


@app.get("/")
def root():
    return {"mensaje": "Bienvenido a la API de Mamunis"}
