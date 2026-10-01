from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import requerir_admin
from app.core.database import get_db
from app.models.categoria import Categoria
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoResponse, ProductoUpdate

router = APIRouter(prefix="/productos", tags=["Productos"])


def _validar_categoria(categoria_id: int, db: Session) -> None:
    if not db.query(Categoria).filter(Categoria.id == categoria_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")


@router.get("/", response_model=list[ProductoResponse])
def listar_productos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    categoria_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Producto)
    if categoria_id is not None:
        query = query.filter(Producto.categoria_id == categoria_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return producto


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requerir_admin)])
def crear_producto(datos: ProductoCreate, db: Session = Depends(get_db)):
    _validar_categoria(datos.categoria_id, db)
    producto = Producto(**datos.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.patch("/{producto_id}", response_model=ProductoResponse, dependencies=[Depends(requerir_admin)])
def actualizar_producto(producto_id: int, datos: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    if datos.categoria_id is not None:
        _validar_categoria(datos.categoria_id, db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(requerir_admin)])
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
