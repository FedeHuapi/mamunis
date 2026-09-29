from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.auth import get_usuario_actual
from app.core.database import get_db
from app.core.limitador import intentos_login_por_cuenta, intentos_login_por_ip
from app.core.security import crear_token_acceso, hash_password, verify_password
from app.models.usuario import Usuario
from app.schemas.usuario import TokenResponse, UsuarioCreate, UsuarioLogin, UsuarioResponse

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == datos.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe una cuenta con ese email")
    usuario = Usuario(
        nombre=datos.nombre,
        email=datos.email,
        password_hash=hash_password(datos.password),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.get("/me", response_model=UsuarioResponse)
def obtener_usuario_actual(usuario: Usuario = Depends(get_usuario_actual)):
    return usuario


@router.post("/login", response_model=TokenResponse)
def login(datos: UsuarioLogin, request: Request, db: Session = Depends(get_db)):
    # Detras de un proxy (Nginx, Render, etc.) request.client.host es la IP del proxy:
    # en produccion uvicorn tiene que correr con --proxy-headers para ver la IP real.
    ip = request.client.host if request.client else "desconocida"
    clave_cuenta = f"{ip}|{datos.email.lower()}"

    espera = max(
        intentos_login_por_cuenta.segundos_de_bloqueo(clave_cuenta),
        intentos_login_por_ip.segundos_de_bloqueo(ip),
    )
    if espera:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos fallidos. Probá de nuevo más tarde.",
            headers={"Retry-After": str(espera)},
        )

    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        intentos_login_por_cuenta.registrar_fallo(clave_cuenta)
        intentos_login_por_ip.registrar_fallo(ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")

    intentos_login_por_cuenta.reiniciar(clave_cuenta)
    return TokenResponse(access_token=crear_token_acceso(usuario.id))
