from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

ALGORITMO_JWT = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def crear_token_acceso(usuario_id: int) -> str:
    vencimiento = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    contenido = {"sub": str(usuario_id), "exp": vencimiento}
    return jwt.encode(contenido, settings.SECRET_KEY, algorithm=ALGORITMO_JWT)


def leer_usuario_id_del_token(token: str) -> int | None:
    try:
        contenido = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITMO_JWT])
        return int(contenido["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
