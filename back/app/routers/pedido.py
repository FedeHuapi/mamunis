from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.auth import get_usuario_opcional, requerir_admin
from app.core.database import get_db
from app.models.carrito import Carrito
from app.models.pedido import EstadoPedido, Pedido, PedidoItem
from app.models.producto import Variante
from app.models.usuario import Usuario
from app.schemas.pedido import CambiarEstadoRequest, PedidoCreate, PedidoResponse
from app.services.pedido_service import (
    StockInsuficiente,
    TransicionInvalida,
    cambiar_estado,
    cantidades_por_variante,
    reservar_stock,
)

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _obtener_pedido(pedido_id: int, db: Session) -> Pedido:
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")
    return pedido


@router.post("/", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    datos: PedidoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario | None = Depends(get_usuario_opcional),
):
    carrito = db.query(Carrito).filter(Carrito.session_id == datos.session_id).first()
    if not carrito:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carrito no encontrado")
    if not carrito.items:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="El carrito esta vacio")

    try:
        reservar_stock(db, cantidades_por_variante(carrito.items))
    except StockInsuficiente as error:
        db.rollback()
        variante = db.get(Variante, error.variante_id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=(
                f"Stock insuficiente para '{variante.producto.nombre}' talle {variante.talla}. "
                f"Disponible: {variante.stock}"
            ),
        )

    total = sum((item.producto.precio * item.cantidad for item in carrito.items), Decimal("0"))
    pedido = Pedido(
        usuario_id=usuario.id if usuario else None,
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
            variante_id=item.variante_id,
            cantidad=item.cantidad,
            precio_unitario=item.producto.precio,
        ))
        db.delete(item)

    db.commit()
    db.refresh(pedido)
    return pedido


@router.get("/", response_model=list[PedidoResponse], dependencies=[Depends(requerir_admin)])
def listar_pedidos(
    estado: EstadoPedido | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Pedido).options(
        selectinload(Pedido.items).selectinload(PedidoItem.variante).selectinload(Variante.producto)
    )
    if estado is not None:
        query = query.filter(Pedido.estado == estado)
    return query.order_by(Pedido.fecha_creacion.desc(), Pedido.id.desc()).offset(skip).limit(limit).all()


@router.get("/{pedido_id}", response_model=PedidoResponse, dependencies=[Depends(requerir_admin)])
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    return _obtener_pedido(pedido_id, db)


@router.patch("/{pedido_id}/estado", response_model=PedidoResponse, dependencies=[Depends(requerir_admin)])
def actualizar_estado(pedido_id: int, datos: CambiarEstadoRequest, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).with_for_update().first()
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    try:
        cambiar_estado(db, pedido, datos.estado)
    except TransicionInvalida as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    db.commit()
    db.refresh(pedido)
    return pedido
