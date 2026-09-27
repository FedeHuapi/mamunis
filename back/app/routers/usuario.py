from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioResponse

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


@router.post("/login", response_model=UsuarioResponse)
def login(datos: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")
    return usuario
