from sqlalchemy import Boolean, Column, DateTime, Integer, String, false, func

from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    es_admin = Column(Boolean, nullable=False, default=False, server_default=false())
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
