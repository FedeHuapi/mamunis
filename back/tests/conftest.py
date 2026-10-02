from pathlib import Path

from dotenv import load_dotenv

RAIZ_BACK = Path(__file__).resolve().parent.parent
load_dotenv(RAIZ_BACK / ".env.test", override=True)

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.limitador import intentos_login_por_cuenta, intentos_login_por_ip
from app.core.security import crear_token_acceso, hash_password
from app.models.categoria import Categoria
from app.models.producto import Producto, Variante
from app.models.usuario import Usuario
from main import app

engine = create_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def config_alembic() -> Config:
    return Config(str(RAIZ_BACK / "alembic.ini"))


@pytest.fixture(scope="session", autouse=True)
def _preparar_base_de_test():
    # La base de test se construye con las migraciones, igual que produccion, y no con
    # create_all(): asi un error en una migracion hace fallar los tests.
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    command.upgrade(config_alembic(), "head")
    yield


@pytest.fixture()
def alembic_cfg():
    return config_alembic()


@pytest.fixture(autouse=True)
def _reiniciar_limitadores():
    intentos_login_por_cuenta.reiniciar_todo()
    intentos_login_por_ip.reiniciar_todo()


@pytest.fixture(autouse=True)
def _limpiar_tablas_despues_de_cada_test():
    yield
    with engine.begin() as connection:
        for tabla in reversed(Base.metadata.sorted_tables):
            connection.execute(tabla.delete())


@pytest.fixture()
def db_session():
    session = TestingSessionLocal()
    yield session
    session.close()


@pytest.fixture()
def client(db_session):
    def _get_db_de_test():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_de_test
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _crear_usuario(db_session, email, es_admin):
    usuario = Usuario(nombre="Test", email=email, password_hash=hash_password("claveSegura123"), es_admin=es_admin)
    db_session.add(usuario)
    db_session.commit()
    return usuario


@pytest.fixture()
def usuario_cliente(db_session):
    return _crear_usuario(db_session, "cliente@mamunis.com", es_admin=False)


@pytest.fixture()
def usuario_admin(db_session):
    return _crear_usuario(db_session, "admin@mamunis.com", es_admin=True)


@pytest.fixture()
def headers_cliente(usuario_cliente):
    return {"Authorization": f"Bearer {crear_token_acceso(usuario_cliente.id)}"}


@pytest.fixture()
def headers_admin(usuario_admin):
    return {"Authorization": f"Bearer {crear_token_acceso(usuario_admin.id)}"}


@pytest.fixture()
def categoria(db_session):
    categoria = Categoria(nombre="Remeras", descripcion="Remeras de manga corta")
    db_session.add(categoria)
    db_session.commit()
    return categoria


@pytest.fixture()
def producto(db_session, categoria):
    producto = Producto(
        nombre="Remera Dino",
        precio=5000,
        categoria_id=categoria.id,
        variantes=[Variante(talla="10", stock=5)],
    )
    db_session.add(producto)
    db_session.commit()
    return producto


@pytest.fixture()
def variante(producto):
    return producto.variantes[0]
