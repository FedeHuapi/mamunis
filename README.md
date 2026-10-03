# Mamunis

![Tests](https://github.com/FedeHuapi/mamunis/actions/workflows/tests.yml/badge.svg?branch=back-dev)
![Auditoría de dependencias](https://github.com/FedeHuapi/mamunis/actions/workflows/auditoria.yml/badge.svg?branch=back-dev)

Tienda online para un emprendimiento de ropa infantil llamado "Mamunis".

## Estado del proyecto

En desarrollo activo, sin fecha de lanzamiento aún. El backend cubre catálogo, carrito y checkout (compra como invitado o con cuenta, pago coordinado manualmente por fuera del sitio). El frontend está en sus primeros pasos: por ahora muestra el catálogo.

## Stack

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL, migraciones con Alembic.
- **Frontend:** React + TypeScript + Vite, estilos con Tailwind CSS.

## Estructura del repositorio

```
mamunis/
├── back/     API REST (FastAPI)
│   └── app/
│       ├── core/      configuración, conexión a la base, seguridad
│       ├── models/     tablas (SQLAlchemy)
│       ├── schemas/    validación de entrada/salida (Pydantic)
│       └── routers/    endpoints HTTP
└── front/    interfaz web (React)
    └── src/
        ├── api/         conexión con el backend y tipos generados desde la API
        ├── components/  piezas reutilizables
        ├── pages/       una por pantalla
        └── lib/         funciones de ayuda
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

## Cómo correr el frontend en local

Requisitos: Node.js 24+ y el backend corriendo (ver arriba).

```bash
cd front
npm install
npm run dev
```

La tienda queda en `http://localhost:5173`.

Los tipos de TypeScript de la API se generan a partir del backend. Después de cambiar un endpoint o un schema, con el backend corriendo:

```bash
npm run api:types
```

Antes de subir cambios: `npm run lint` y `npm run build`.

## Tests

Los tests corren contra una base Postgres separada, para no tocar la de desarrollo.

```bash
pip install -r requirements-dev.txt

createdb mamunis_test_db          # una sola vez
copy .env.test.example .env.test  # y completar con tus credenciales

pytest
```

El estilo y los errores comunes los revisa [ruff](https://docs.astral.sh/ruff/):

```bash
ruff check .         # revisa
ruff check . --fix   # arregla lo que se puede arreglar solo
```

Cada Pull Request corre el linter y esta misma suite automáticamente vía GitHub Actions (ver el badge arriba).

## Notas para el deploy

- Configurar `ENTORNO=produccion`, una `SECRET_KEY` propia y `CORS_ORIGINS` con el dominio del front.
- Correr `alembic upgrade head` antes de levantar la API.
- Si la API corre detrás de un proxy (lo habitual en un hosting), levantar uvicorn con
  `--proxy-headers --forwarded-allow-ips=<IP del proxy>`. Sin eso, todos los clientes
  parecen venir de la IP del proxy y el límite de intentos de login los bloquea a todos juntos.
- Levantar uvicorn con `--no-server-header` para no anunciar qué servidor se usa.
- Configurar `CLOUDINARY_URL` (se copia del panel de Cloudinary) para poder subir imágenes de productos.
- Limitar el tamaño de los requests en el proxy (por ejemplo `client_max_body_size 6m` en Nginx).
  La API rechaza imágenes de más de 5 MB, pero recién después de recibir el archivo entero.

## Flujo de trabajo

- `main`: rama estable.
- `back-dev`: integración del trabajo de backend.
- `feature/nombre-de-la-tarea`: una rama por tarea, partiendo de `back-dev`, mergeada vía Pull Request cuando está lista.

## Licencia

Código publicado con fines de portfolio. Todos los derechos reservados — no está autorizado su uso para desplegar una tienda propia.
