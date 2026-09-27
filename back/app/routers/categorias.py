from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import requerir_admin
from app.core.database import get_db
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaResponse, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.get("/", response_model=list[CategoriaResponse])
def listar_categorias(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(Categoria).offset(skip).limit(limit).all()


@router.get("/{categoria_id}", response_model=CategoriaResponse)
def obtener_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    return categoria


@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requerir_admin)])
def crear_categoria(datos: CategoriaCreate, db: Session = Depends(get_db)):
    if db.query(Categoria).filter(Categoria.nombre == datos.nombre).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe una categoría con ese nombre")
    categoria = Categoria(**datos.model_dump())
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.patch("/{categoria_id}", response_model=CategoriaResponse, dependencies=[Depends(requerir_admin)])
def actualizar_categoria(categoria_id: int, datos: CategoriaUpdate, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    if datos.nombre:
        duplicado = db.query(Categoria).filter(
            Categoria.nombre == datos.nombre, Categoria.id != categoria_id
        ).first()
        if duplicado:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe una categoría con ese nombre")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(categoria, campo, valor)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(requerir_admin)])
def eliminar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    db.delete(categoria)
    db.commit()
