from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.carrito import Carrito
from app.models.pedido import EstadoPedido, Pedido, PedidoItem
from app.schemas.pedido import PedidoCreate, PedidoResponse

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _obtener_pedido(pedido_id: int, db: Session) -> Pedido:
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    return pedido


@router.post("/", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
def crear_pedido(datos: PedidoCreate, db: Session = Depends(get_db)):
    carrito = db.query(Carrito).filter(Carrito.session_id == datos.session_id).first()
    if not carrito:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carrito no encontrado")
    if not carrito.items:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="El carrito esta vacio")

    for item in carrito.items:
        if item.producto.stock < item.cantidad:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Stock insuficiente para '{item.producto.nombre}'. Disponible: {item.producto.stock}",
            )

    total = sum((item.producto.precio * item.cantidad for item in carrito.items), Decimal("0"))
    pedido = Pedido(
        estado=EstadoPedido.PENDIENTE,
        nombre_contacto=datos.nombre_contacto,
        email_contacto=datos.email_contacto,
        telefono_contacto=datos.telefono_contacto,
        direccion_envio=datos.direccion_envio,
        total=total,
    )
    db.add(pedido)

    for item in carrito.items:
        db.add(PedidoItem(
            pedido=pedido,
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            precio_unitario=item.producto.precio,
        ))
        item.producto.stock -= item.cantidad
        db.delete(item)

    db.commit()
    db.refresh(pedido)
    return pedido


@router.get("/{pedido_id}", response_model=PedidoResponse)
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    return _obtener_pedido(pedido_id, db)


@router.post("/{pedido_id}/cancelar", response_model=PedidoResponse)
def cancelar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = _obtener_pedido(pedido_id, db)
    if pedido.estado == EstadoPedido.CANCELADO:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El pedido ya esta cancelado")

    for item in pedido.items:
        item.producto.stock += item.cantidad
    pedido.estado = EstadoPedido.CANCELADO

    db.commit()
    db.refresh(pedido)
    return pedido
