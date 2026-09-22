from sqlalchemy import Column, Integer, String, Text, Numeric, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class Talla(str, enum.Enum):
    RN = "RN"       # Recién nacido
    T1 = "1"
    T2 = "2"
    T3 = "3"
    T4 = "4"
    T5 = "5"
    T6 = "6"
    T7 = "7"
    T8 = "8"
    T10 = "10"
    T12 = "12"
    T14 = "14"
    T16 = "16"


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    talla = Column(SAEnum(Talla), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    imagen = Column(String(500), nullable=True)

    categoria = relationship("Categoria", back_populates="productos")
