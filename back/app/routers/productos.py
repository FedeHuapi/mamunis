import logging

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.auth import requerir_admin
from app.core.database import get_db
from app.core.paginacion import Pagina, paginar
from app.models.categoria import Categoria
from app.models.producto import Producto, Variante
from app.schemas.producto import (
    ProductoCreate,
    ProductoResponse,
    ProductoUpdate,
    VarianteCreate,
    VarianteResponse,
    VarianteUpdate,
)
from app.services.imagenes import (
    FORMATOS_PERMITIDOS,
    TAMANO_MAXIMO,
    AlmacenCloudinary,
    ErrorAlSubirImagen,
    detectar_formato,
    get_almacen_de_imagenes,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/productos", tags=["Productos"])

_EN_USO = "No se puede eliminar: está en algún carrito o pedido"


def _validar_categoria(categoria_id: int, db: Session) -> None:
    if not db.query(Categoria).filter(Categoria.id == categoria_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")


def _obtener_producto(producto_id: int, db: Session) -> Producto:
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return producto


def _obtener_variante(producto_id: int, variante_id: int, db: Session) -> Variante:
    # Se filtra tambien por producto: la variante tiene que ser de ese producto.
    variante = (
        db.query(Variante)
        .filter(Variante.id == variante_id, Variante.producto_id == producto_id)
        .first()
    )
    if not variante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Talle no encontrado")
    return variante


def _eliminar(objeto, db: Session) -> None:
    # Un talle que esta en un carrito o en un pedido no se puede borrar: la base lo
    # impide para no dejar pedidos apuntando a algo que ya no existe.
    try:
        db.delete(objeto)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_EN_USO)


@router.get("/", response_model=Pagina[ProductoResponse])
def listar_productos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    categoria_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Producto).options(joinedload(Producto.categoria), selectinload(Producto.variantes))
    if categoria_id is not None:
        query = query.filter(Producto.categoria_id == categoria_id)
    return paginar(query.order_by(Producto.id), skip, limit)


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    return _obtener_producto(producto_id, db)


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(requerir_admin)])
def crear_producto(datos: ProductoCreate, db: Session = Depends(get_db)):
    _validar_categoria(datos.categoria_id, db)
    producto = Producto(
        **datos.model_dump(exclude={"variantes"}),
        variantes=[Variante(**variante.model_dump()) for variante in datos.variantes],
    )
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.patch("/{producto_id}", response_model=ProductoResponse, dependencies=[Depends(requerir_admin)])
def actualizar_producto(producto_id: int, datos: ProductoUpdate, db: Session = Depends(get_db)):
    producto = _obtener_producto(producto_id, db)
    if datos.categoria_id is not None:
        _validar_categoria(datos.categoria_id, db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(requerir_admin)])
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    _eliminar(_obtener_producto(producto_id, db), db)


@router.post("/{producto_id}/imagen", response_model=ProductoResponse, dependencies=[Depends(requerir_admin)])
def subir_imagen(
    producto_id: int,
    archivo: UploadFile,
    db: Session = Depends(get_db),
    almacen: AlmacenCloudinary = Depends(get_almacen_de_imagenes),
):
    producto = _obtener_producto(producto_id, db)

    # Se lee como mucho un byte mas que el maximo: alcanza para saber si se paso.
    contenido = archivo.file.read(TAMANO_MAXIMO + 1)
    if len(contenido) > TAMANO_MAXIMO:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"La imagen no puede pesar más de {TAMANO_MAXIMO // (1024 * 1024)} MB",
        )
    if detectar_formato(contenido) is None:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"El archivo no es una imagen válida. Formatos: {', '.join(FORMATOS_PERMITIDOS)}",
        )

    try:
        # El nombre lo decide el servidor, nunca el que sube el archivo.
        producto.imagen = almacen.subir(contenido, f"producto-{producto.id}")
    except ErrorAlSubirImagen as error:
        logger.error("No se pudo subir la imagen del producto %s: %s", producto.id, error)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="No se pudo guardar la imagen")
    db.commit()
    db.refresh(producto)
    return producto


@router.post(
    "/{producto_id}/variantes",
    response_model=VarianteResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requerir_admin)],
)
def agregar_variante(producto_id: int, datos: VarianteCreate, db: Session = Depends(get_db)):
    producto = _obtener_producto(producto_id, db)
    variante = Variante(producto_id=producto.id, **datos.model_dump())
    db.add(variante)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El producto ya tiene ese talle")
    db.refresh(variante)
    return variante


@router.patch(
    "/{producto_id}/variantes/{variante_id}",
    response_model=VarianteResponse,
    dependencies=[Depends(requerir_admin)],
)
def actualizar_stock_de_variante(
    producto_id: int, variante_id: int, datos: VarianteUpdate, db: Session = Depends(get_db)
):
    variante = _obtener_variante(producto_id, variante_id, db)
    variante.stock = datos.stock
    db.commit()
    db.refresh(variante)
    return variante


@router.delete(
    "/{producto_id}/variantes/{variante_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requerir_admin)],
)
def eliminar_variante(producto_id: int, variante_id: int, db: Session = Depends(get_db)):
    _eliminar(_obtener_variante(producto_id, variante_id, db), db)
