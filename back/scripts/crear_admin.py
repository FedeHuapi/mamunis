"""Crea un usuario administrador, o promueve a admin a un usuario existente.

Uso (desde la carpeta back/):
    python -m scripts.crear_admin
"""
from getpass import getpass

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.usuario import Usuario

LARGO_MINIMO_PASSWORD = 8


def crear_o_promover_admin(db: Session, email: str, nombre: str | None = None, password: str | None = None) -> Usuario:
    email = email.strip().lower()
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario:
        usuario.es_admin = True
    else:
        if not nombre or not password:
            raise ValueError("Para crear un usuario nuevo hacen falta nombre y contraseña")
        if len(password) < LARGO_MINIMO_PASSWORD:
            raise ValueError(f"La contraseña debe tener al menos {LARGO_MINIMO_PASSWORD} caracteres")
        usuario = Usuario(nombre=nombre, email=email, password_hash=hash_password(password), es_admin=True)
        db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def main() -> None:
    email = input("Email del admin: ").strip().lower()
    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.email == email).first():
            confirmacion = input(f"{email} ya tiene cuenta. ¿Convertirlo en admin? (s/n): ")
            if confirmacion.strip().lower() != "s":
                print("Cancelado.")
                return
            crear_o_promover_admin(db, email)
        else:
            nombre = input("Nombre: ").strip()
            password = getpass("Contraseña: ")
            if password != getpass("Repetir contraseña: "):
                print("Las contraseñas no coinciden.")
                return
            crear_o_promover_admin(db, email, nombre, password)
        print(f"Listo: {email} es administrador.")
    except ValueError as error:
        print(f"Error: {error}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
