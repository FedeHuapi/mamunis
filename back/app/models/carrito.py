import uuid
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Carrito(Base):
    __tablename__ = "carritos"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    items = relationship("CarritoItem", back_populates="carrito", cascade="all, delete-orphan")


class CarritoItem(Base):
    __tablename__ = "carrito_items"

    id = Column(Integer, primary_key=True, index=True)
    carrito_id = Column(Integer, ForeignKey("carritos.id"), nullable=False)
    variante_id = Column(Integer, ForeignKey("variantes.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)

    carrito = relationship("Carrito", back_populates="items")
    variante = relationship("Variante")

    @property
    def producto(self):
        return self.variante.producto

    @property
    def talla(self):
        return self.variante.talla
