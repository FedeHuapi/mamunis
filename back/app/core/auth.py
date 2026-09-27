from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import leer_usuario_id_del_token
from app.models.usuario import Usuario

_esquema_bearer = HTTPBearer(auto_error=False)

_NO_AUTENTICADO = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No autenticado",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_usuario_actual(
    credenciales: HTTPAuthorizationCredentials | None = Depends(_esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    if credenciales is None:
        raise _NO_AUTENTICADO
    usuario_id = leer_usuario_id_del_token(credenciales.credentials)
    if usuario_id is None:
        raise _NO_AUTENTICADO
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise _NO_AUTENTICADO
    return usuario


def requerir_admin(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
    if not usuario.es_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requieren permisos de administrador")
    return usuario
