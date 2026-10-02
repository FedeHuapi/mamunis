import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import leer_usuario_id_del_token
from app.models.usuario import Usuario

logger = logging.getLogger(__name__)

_esquema_bearer = HTTPBearer(auto_error=False)

_NO_AUTENTICADO = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No autenticado",
    headers={"WWW-Authenticate": "Bearer"},
)


def _usuario_del_token(credenciales: HTTPAuthorizationCredentials, db: Session) -> Usuario:
    usuario_id = leer_usuario_id_del_token(credenciales.credentials)
    if usuario_id is None:
        raise _NO_AUTENTICADO
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise _NO_AUTENTICADO
    return usuario


def get_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if credenciales is None:
        raise _NO_AUTENTICADO
    return _usuario_del_token(credenciales, db)


def get_usuario_opcional(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario | None:
    # Sin token: invitado. Con token invalido o vencido: 401, no invitado en silencio,
    # para que el cliente no crea que compro con su cuenta cuando no fue asi.
    if credenciales is None:
        return None
    return _usuario_del_token(credenciales, db)


def requerir_admin(request: Request, usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
    if not usuario.es_admin:
        logger.warning("Acceso denegado: usuario %s intento %s %s", usuario.id, request.method, request.url.path)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requieren permisos de administrador")
    # Todo endpoint de admin pasa por aca, asi que cada cambio queda registrado sin
    # depender de que alguien se acuerde de loguearlo en el endpoint.
    if request.method != "GET":
        logger.info("Admin %s: %s %s", usuario.id, request.method, request.url.path)
    return usuario
