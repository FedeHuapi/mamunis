from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env.test", override=True)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import crear_token_acceso, hash_password
from app.models.categoria import Categoria
from app.models.producto import Producto, Talla
from app.models.usuario import Usuario
from main import app

engine = create_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def _preparar_base_de_test():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


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
        talla=Talla.T4,
        categoria_id=categoria.id,
        stock=5,
    )
    db_session.add(producto)
    db_session.commit()
    return producto
