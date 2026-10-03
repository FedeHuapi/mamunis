import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session, selectinload

from app.core.auth import get_usuario_actual
from app.core.database import get_db
from app.core.limitador import intentos_login_por_cuenta, intentos_login_por_ip
from app.core.paginacion import Pagina, paginar
from app.core.security import crear_token_acceso, hash_password, verify_password
from app.models.pedido import Pedido, PedidoItem
from app.models.producto import Variante
from app.models.usuario import Usuario
from app.schemas.pedido import PedidoResponse
from app.schemas.usuario import (
    TokenResponse,
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
)

logger = logging.getLogger(__name__)

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
    logger.info("Cuenta creada: usuario %s", usuario.id)
    return usuario


@router.get("/me", response_model=UsuarioResponse)
def obtener_usuario_actual(usuario: Usuario = Depends(get_usuario_actual)):
    return usuario


@router.get("/me/pedidos", response_model=Pagina[PedidoResponse])
def listar_mis_pedidos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Pedido)
        .options(selectinload(Pedido.items).selectinload(PedidoItem.variante).selectinload(Variante.producto))
        .filter(Pedido.usuario_id == usuario.id)
        .order_by(Pedido.fecha_creacion.desc(), Pedido.id.desc())
    )
    return paginar(query, skip, limit)


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
        logger.warning("Login bloqueado por demasiados intentos: email=%r ip=%s", datos.email, ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos fallidos. Probá de nuevo más tarde.",
            headers={"Retry-After": str(espera)},
        )

    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        intentos_login_por_cuenta.registrar_fallo(clave_cuenta)
        intentos_login_por_ip.registrar_fallo(ip)
        logger.warning("Login fallido: email=%r ip=%s", datos.email, ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")

    intentos_login_por_cuenta.reiniciar(clave_cuenta)
    logger.info("Login correcto: usuario %s ip=%s", usuario.id, ip)
    return TokenResponse(access_token=crear_token_acceso(usuario.id))
