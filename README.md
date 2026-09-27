# Mamunis

![Tests](https://github.com/FedeHuapi/mamunis/actions/workflows/tests.yml/badge.svg?branch=back-dev)

Tienda online para un emprendimiento de ropa infantil llamado "Mamunis".

## Estado del proyecto

En desarrollo activo, sin fecha de lanzamiento aún. El backend cubre catálogo, carrito y checkout (compra como invitado o con cuenta, pago coordinado manualmente por fuera del sitio). El frontend todavía no arrancó.

## Stack

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL, migraciones con Alembic.
- **Frontend:** a definir.

## Estructura del repositorio

```
mamunis/
├── back/     API REST (FastAPI)
│   └── app/
│       ├── core/      configuración, conexión a la base, seguridad
│       ├── models/     tablas (SQLAlchemy)
│       ├── schemas/    validación de entrada/salida (Pydantic)
│       └── routers/    endpoints HTTP
└── front/    interfaz web (todavía sin empezar)
```

## Cómo correr el backend en local

Requisitos: Python 3.11+ y una base PostgreSQL corriendo.

```bash
cd back
python -m venv venv
venv\Scripts\activate        # en Windows
pip install -r requirements.txt

copy .env.example .env       # y completar DATABASE_URL con tus credenciales

alembic upgrade head         # aplica las migraciones y crea las tablas

uvicorn main:app --reload
```

Para crear el usuario administrador (el único que puede modificar el catálogo y gestionar pedidos):

```bash
python -m scripts.crear_admin
```

La API queda en `http://127.0.0.1:8000`. FastAPI genera documentación interactiva automática en `/docs` (Swagger) y `/redoc` — no hace falta mantenerla a mano, se actualiza sola con el código.

## Tests

Los tests corren contra una base Postgres separada, para no tocar la de desarrollo.

```bash
pip install -r requirements-dev.txt

createdb mamunis_test_db          # una sola vez
copy .env.test.example .env.test  # y completar con tus credenciales

pytest
```

Cada Pull Request corre esta misma suite automáticamente vía GitHub Actions (ver el badge arriba).

## Flujo de trabajo

- `main`: rama estable.
- `back-dev`: integración del trabajo de backend.
- `feature/nombre-de-la-tarea`: una rama por tarea, partiendo de `back-dev`, mergeada vía Pull Request cuando está lista.

## Licencia

Código publicado con fines de portfolio. Todos los derechos reservados — no está autorizado su uso para desplegar una tienda propia.
