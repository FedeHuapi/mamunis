import enum

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import relationship

from app.core.database import Base


class EstadoPedido(str, enum.Enum):
    PENDIENTE = "pendiente"
    CONFIRMADO = "confirmado"
    EN_PREPARACION = "en_preparacion"
    ENVIADO = "enviado"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    estado = Column(SAEnum(EstadoPedido), nullable=False, default=EstadoPedido.PENDIENTE)
    nombre_contacto = Column(String(150), nullable=False)
    email_contacto = Column(String(255), nullable=False)
    telefono_contacto = Column(String(50), nullable=False)
    direccion_envio = Column(Text, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    usuario = relationship("Usuario")
    items = relationship("PedidoItem", back_populates="pedido", cascade="all, delete-orphan")


class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    variante_id = Column(Integer, ForeignKey("variantes.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)  # copia del precio al momento de comprar, no cambia si el producto cambia de precio despues

    pedido = relationship("Pedido", back_populates="items")
    variante = relationship("Variante")

    @property
    def producto(self):
        return self.variante.producto

    @property
    def talla(self):
        return self.variante.talla
