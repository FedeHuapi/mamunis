import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.auth import requerir_admin
from app.core.database import get_db
from app.core.limitador import solicitudes_de_arrepentimiento_por_ip
from app.core.paginacion import Pagina, paginar
from app.models.arrepentimiento import Arrepentimiento, EstadoArrepentimiento
from app.models.pedido import Pedido
from app.schemas.arrepentimiento import (
    ArrepentimientoCreado,
    ArrepentimientoCreate,
    ArrepentimientoResponse,
    CambiarEstadoArrepentimiento,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/arrepentimientos", tags=["Arrepentimientos"])

# Sin letras ni numeros que se confunden al dictarlos o copiarlos (O y 0, I y 1, L).
_CARACTERES_DEL_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_INTENTOS_DE_CODIGO = 5


def generar_codigo() -> str:
    """Un codigo al azar, como ARR-7K3QX9MD. No es correlativo: no deja adivinar cuantas
    solicitudes hubo ni cual es la de otra persona."""
    return "ARR-" + "".join(secrets.choice(_CARACTERES_DEL_CODIGO) for _ in range(8))


def _pedido_que_coincide(datos: ArrepentimientoCreate, db: Session) -> Pedido | None:
    # Se vincula solo si el pedido existe Y fue hecho con ese email: un numero de pedido
    # solo no alcanza, porque son correlativos y cualquiera podria escribir uno ajeno.
    if datos.numero_pedido is None:
        return None
    pedido = db.get(Pedido, datos.numero_pedido)
    if pedido and pedido.email_contacto.lower() == datos.email:
        return pedido
    return None


@router.post("/", response_model=ArrepentimientoCreado, status_code=status.HTTP_201_CREATED)
def crear_arrepentimiento(datos: ArrepentimientoCreate, request: Request, db: Session = Depends(get_db)):
    # Es publico (la norma no deja pedir cuenta), asi que se limita por IP para que no se
    # use para llenar la base de solicitudes falsas.
    ip = request.client.host if request.client else "desconocida"
    espera = solicitudes_de_arrepentimiento_por_ip.segundos_de_bloqueo(ip)
    if espera:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Hiciste muchas solicitudes seguidas. Probá de nuevo más tarde o escribinos por WhatsApp.",
            headers={"Retry-After": str(espera)},
        )

    pedido = _pedido_que_coincide(datos, db)
    for intento in range(_INTENTOS_DE_CODIGO):
        solicitud = Arrepentimiento(**datos.model_dump(), codigo=generar_codigo(), pedido_id=pedido.id if pedido else None)
        db.add(solicitud)
        try:
            db.commit()
            break
        except IntegrityError:
            # Dos codigos al azar iguales es rarisimo (hay mas de 800 mil millones), pero
            # la base lo impide igual: se prueba con otro.
            db.rollback()
            if intento == _INTENTOS_DE_CODIGO - 1:
                raise
    db.refresh(solicitud)

    solicitudes_de_arrepentimiento_por_ip.registrar_fallo(ip)
    # Sin datos personales en el log: el codigo alcanza para encontrarla en el panel.
    logger.info("Arrepentimiento %s recibido (%s)", solicitud.codigo, f"pedido {pedido.id}" if pedido else "sin pedido vinculado")
    return solicitud


@router.get("/", response_model=Pagina[ArrepentimientoResponse], dependencies=[Depends(requerir_admin)])
def listar_arrepentimientos(
    estado: EstadoArrepentimiento | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Arrepentimiento).options(joinedload(Arrepentimiento.pedido))
    if estado is not None:
        query = query.filter(Arrepentimiento.estado == estado)
    return paginar(query.order_by(Arrepentimiento.fecha_creacion.desc(), Arrepentimiento.id.desc()), skip, limit)


@router.patch("/{arrepentimiento_id}/estado", response_model=ArrepentimientoResponse, dependencies=[Depends(requerir_admin)])
def cambiar_estado(arrepentimiento_id: int, datos: CambiarEstadoArrepentimiento, db: Session = Depends(get_db)):
    solicitud = db.get(Arrepentimiento, arrepentimiento_id)
    if not solicitud:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada")
    solicitud.estado = datos.estado
    db.commit()
    db.refresh(solicitud)
    return solicitud
