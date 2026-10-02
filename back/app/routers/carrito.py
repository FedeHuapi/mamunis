from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.carrito import Carrito, CarritoItem
from app.models.producto import Variante
from app.schemas.carrito import (
    ActualizarCantidadRequest,
    AgregarItemRequest,
    CarritoCreado,
    CarritoItemResponse,
    CarritoResponse,
    ProductoEnItem,
)

router = APIRouter(prefix="/carrito", tags=["Carrito"])


def _obtener_carrito(session_id: UUID, db: Session) -> Carrito:
    carrito = db.query(Carrito).filter(Carrito.session_id == session_id).first()
    if not carrito:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carrito no encontrado")
    return carrito


def _obtener_item(session_id: UUID, item_id: int, db: Session) -> CarritoItem:
    carrito = _obtener_carrito(session_id, db)
    item = (
        db.query(CarritoItem)
        .filter(CarritoItem.id == item_id, CarritoItem.carrito_id == carrito.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item no encontrado")
    return item


def _validar_stock(variante: Variante, cantidad: int) -> None:
    if variante.stock < cantidad:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Stock insuficiente. Disponible: {variante.stock}",
        )


def _construir_item(item: CarritoItem) -> CarritoItemResponse:
    return CarritoItemResponse(
        id=item.id,
        producto=ProductoEnItem.model_validate(item.producto),
        variante_id=item.variante_id,
        talla=item.talla,
        cantidad=item.cantidad,
    )


def _construir_respuesta(carrito: Carrito) -> CarritoResponse:
    items = [_construir_item(item) for item in carrito.items]
    total = sum(item.producto.precio * item.cantidad for item in carrito.items) or Decimal("0")
    return CarritoResponse(
        session_id=carrito.session_id,
        fecha_creacion=carrito.fecha_creacion,
        items=items,
        total=total,
    )


@router.post("/", response_model=CarritoCreado, status_code=status.HTTP_201_CREATED)
def crear_carrito(db: Session = Depends(get_db)):
    carrito = Carrito()
    db.add(carrito)
    db.commit()
    db.refresh(carrito)
    return carrito


@router.get("/{session_id}", response_model=CarritoResponse)
def obtener_carrito(session_id: UUID, db: Session = Depends(get_db)):
    carrito = _obtener_carrito(session_id, db)
    return _construir_respuesta(carrito)


@router.post("/{session_id}/items", response_model=CarritoResponse, status_code=status.HTTP_201_CREATED)
def agregar_item(session_id: UUID, datos: AgregarItemRequest, db: Session = Depends(get_db)):
    carrito = _obtener_carrito(session_id, db)

    variante = db.get(Variante, datos.variante_id)
    if not variante:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Talle no encontrado")

    item_existente = next((i for i in carrito.items if i.variante_id == datos.variante_id), None)
    cantidad_total = (item_existente.cantidad if item_existente else 0) + datos.cantidad
    _validar_stock(variante, cantidad_total)

    if item_existente:
        item_existente.cantidad = cantidad_total
    else:
        db.add(CarritoItem(carrito_id=carrito.id, variante_id=datos.variante_id, cantidad=datos.cantidad))

    db.commit()
    db.refresh(carrito)
    return _construir_respuesta(carrito)


@router.patch("/{session_id}/items/{item_id}", response_model=CarritoItemResponse)
def actualizar_cantidad(
    session_id: UUID, item_id: int, datos: ActualizarCantidadRequest, db: Session = Depends(get_db)
):
    item = _obtener_item(session_id, item_id, db)
    _validar_stock(item.variante, datos.cantidad)
    item.cantidad = datos.cantidad
    db.commit()
    db.refresh(item)
    return _construir_item(item)


@router.delete("/{session_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_item(session_id: UUID, item_id: int, db: Session = Depends(get_db)):
    item = _obtener_item(session_id, item_id, db)
    db.delete(item)
    db.commit()
