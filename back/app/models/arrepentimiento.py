import enum

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class EstadoArrepentimiento(str, enum.Enum):
    RECIBIDA = "recibida"
    EN_PROCESO = "en_proceso"
    RESUELTA = "resuelta"


class Arrepentimiento(Base):
    """Una solicitud hecha con el boton de arrepentimiento (Resolucion 424/2020).

    Se guarda lo que la persona escribio tal cual. Si el numero de pedido y el email
    coinciden con un pedido real, ademas queda vinculado a ese pedido (`pedido_id`).
    """

    __tablename__ = "arrepentimientos"

    id = Column(Integer, primary_key=True, index=True)
    # El codigo de identificacion que la norma obliga a entregarle a la persona.
    codigo = Column(String(12), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    telefono = Column(String(50), nullable=True)
    numero_pedido = Column(Integer, nullable=True)  # el que escribio la persona, exista o no
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=True)
    motivo = Column(Text, nullable=True)
    estado = Column(SAEnum(EstadoArrepentimiento), nullable=False, default=EstadoArrepentimiento.RECIBIDA)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    pedido = relationship("Pedido")
