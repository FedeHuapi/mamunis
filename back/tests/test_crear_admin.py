import pytest

from app.core.security import verify_password
from app.models.usuario import Usuario
from scripts.crear_admin import crear_o_promover_admin


def test_crea_admin_nuevo(db_session):
    admin = crear_o_promover_admin(db_session, "admin@mamunis.com", "Admin", "claveSegura123")

    assert admin.es_admin is True
    assert verify_password("claveSegura123", admin.password_hash)


def test_promueve_usuario_existente(db_session):
    db_session.add(Usuario(nombre="Fede", email="fede@mamunis.com", password_hash="x"))
    db_session.commit()

    admin = crear_o_promover_admin(db_session, "fede@mamunis.com")

    assert admin.es_admin is True
    assert db_session.query(Usuario).count() == 1


def test_rechaza_password_corta(db_session):
    with pytest.raises(ValueError):
        crear_o_promover_admin(db_session, "admin@mamunis.com", "Admin", "corta")


def test_usuario_nuevo_requiere_nombre_y_password(db_session):
    with pytest.raises(ValueError):
        crear_o_promover_admin(db_session, "admin@mamunis.com")


def test_guarda_el_email_del_admin_en_minusculas(db_session):
    admin = crear_o_promover_admin(db_session, "Admin@Mamunis.com", "Admin", "claveSegura123")

    assert admin.email == "admin@mamunis.com"


def test_promueve_aunque_el_email_venga_con_otras_mayusculas(db_session):
    crear_o_promover_admin(db_session, "admin@mamunis.com", "Admin", "claveSegura123")

    admin = crear_o_promover_admin(db_session, "ADMIN@mamunis.com")

    assert db_session.query(Usuario).count() == 1
    assert admin.es_admin is True
