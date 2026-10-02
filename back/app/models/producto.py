from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base

# Talles que se pueden cargar. La base guarda el talle como texto, asi que sumar o
# sacar uno es cambiar esta lista: no hace falta una migracion.
TALLAS = ("10", "12", "14", "16")


class Producto(Base):
    """La ficha de la prenda: lo que se muestra en la tienda. Lo que se compra es una Variante."""

    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    imagen = Column(String(500), nullable=True)

    categoria = relationship("Categoria", back_populates="productos")
    variantes = relationship(
        "Variante", back_populates="producto", cascade="all, delete-orphan", order_by="Variante.id"
    )


class Variante(Base):
    """Un talle concreto de un producto, con su propio stock."""

    __tablename__ = "variantes"
    __table_args__ = (
        UniqueConstraint("producto_id", "talla", name="uq_variantes_producto_talla"),
        CheckConstraint("stock >= 0", name="ck_variantes_stock_no_negativo"),
    )

    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False, index=True)
    talla = Column(String(20), nullable=False)
    stock = Column(Integer, default=0, nullable=False)

    producto = relationship("Producto", back_populates="variantes")
