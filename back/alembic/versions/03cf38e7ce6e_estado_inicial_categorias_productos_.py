"""estado inicial: categorias, productos, carrito

Revision ID: 03cf38e7ce6e
Revises: 
Create Date: 2026-09-25 17:16:43.212327

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '03cf38e7ce6e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TALLAS = ('RN', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T10', 'T12', 'T14', 'T16')


def upgrade() -> None:
    """Upgrade schema."""
    # Esta migracion se genero vacia porque en la base de desarrollo las tablas ya existian
    # (las habia creado create_all antes de usar Alembic). Se completo a mano para que una
    # base nueva, como la de produccion, se pueda construir solo con las migraciones.
    op.create_table('categorias',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nombre')
    )
    op.create_index(op.f('ix_categorias_id'), 'categorias', ['id'], unique=False)
    op.create_table('productos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=150), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=True),
    sa.Column('precio', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('talla', sa.Enum(*TALLAS, name='talla'), nullable=False),
    sa.Column('categoria_id', sa.Integer(), nullable=False),
    sa.Column('stock', sa.Integer(), nullable=False),
    sa.Column('imagen', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['categoria_id'], ['categorias.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_productos_id'), 'productos', ['id'], unique=False)
    op.create_table('carritos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('fecha_creacion', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_carritos_id'), 'carritos', ['id'], unique=False)
    op.create_index(op.f('ix_carritos_session_id'), 'carritos', ['session_id'], unique=True)
    op.create_table('carrito_items',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('carrito_id', sa.Integer(), nullable=False),
    sa.Column('producto_id', sa.Integer(), nullable=False),
    sa.Column('cantidad', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['carrito_id'], ['carritos.id'], ),
    sa.ForeignKeyConstraint(['producto_id'], ['productos.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_carrito_items_id'), 'carrito_items', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_carrito_items_id'), table_name='carrito_items')
    op.drop_table('carrito_items')
    op.drop_index(op.f('ix_carritos_session_id'), table_name='carritos')
    op.drop_index(op.f('ix_carritos_id'), table_name='carritos')
    op.drop_table('carritos')
    op.drop_index(op.f('ix_productos_id'), table_name='productos')
    op.drop_table('productos')
    op.drop_index(op.f('ix_categorias_id'), table_name='categorias')
    op.drop_table('categorias')
    sa.Enum(name='talla').drop(op.get_bind(), checkfirst=True)
