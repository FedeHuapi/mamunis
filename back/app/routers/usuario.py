from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.auth import get_usuario_actual
from app.core.database import get_db
from app.core.security import crear_token_acceso, hash_password, verify_password
from app.models.pedido import Pedido, PedidoItem
from app.models.usuario import Usuario
from app.schemas.pedido import PedidoResponse
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


@router.get("/me/pedidos", response_model=list[PedidoResponse])
def listar_mis_pedidos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    usuario: Usuario = Depends(get_usuario_actual),
    db: Session = Depends(get_db),
):
    return (
        db.query(Pedido)
        .options(selectinload(Pedido.items).selectinload(PedidoItem.producto))
        .filter(Pedido.usuario_id == usuario.id)
        .order_by(Pedido.fecha_creacion.desc(), Pedido.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/login", response_model=TokenResponse)
def login(datos: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")
    return TokenResponse(access_token=crear_token_acceso(usuario.id))
