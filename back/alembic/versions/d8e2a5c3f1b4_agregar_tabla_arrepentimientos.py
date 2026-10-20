"""agregar tabla arrepentimientos

Revision ID: d8e2a5c3f1b4
Revises: c4b1f0a9d2e7
Create Date: 2026-10-20 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8e2a5c3f1b4'
down_revision: Union[str, Sequence[str], None] = 'c4b1f0a9d2e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('arrepentimientos',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('codigo', sa.String(length=12), nullable=False),
    sa.Column('nombre', sa.String(length=150), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('telefono', sa.String(length=50), nullable=True),
    sa.Column('numero_pedido', sa.Integer(), nullable=True),
    sa.Column('pedido_id', sa.Integer(), nullable=True),
    sa.Column('motivo', sa.Text(), nullable=True),
    sa.Column('estado', sa.Enum('RECIBIDA', 'EN_PROCESO', 'RESUELTA', name='estadoarrepentimiento'), nullable=False),
    sa.Column('fecha_creacion', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['pedido_id'], ['pedidos.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('codigo')
    )
    op.create_index(op.f('ix_arrepentimientos_id'), 'arrepentimientos', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_arrepentimientos_id'), table_name='arrepentimientos')
    op.drop_table('arrepentimientos')
    # El tipo enum de Postgres no se borra solo con la tabla (ver la migracion de pedidos).
    sa.Enum(name='estadoarrepentimiento').drop(op.get_bind(), checkfirst=True)
