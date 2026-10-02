"""variantes por talla

Revision ID: c4b1f0a9d2e7
Revises: ae167078a6d0
Create Date: 2026-10-02 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4b1f0a9d2e7'
down_revision: Union[str, Sequence[str], None] = 'ae167078a6d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TALLAS_ENUM = ('RN', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T10', 'T12', 'T14', 'T16')
TABLAS_DE_ITEMS = ('carrito_items', 'pedido_items')


def upgrade() -> None:
    """Upgrade schema."""
    # Escrita a mano: ademas de cambiar las tablas, mueve los datos. Cada producto
    # existente pasa a tener una variante con el talle y el stock que tenia.
    op.create_table('variantes',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('producto_id', sa.Integer(), nullable=False),
    sa.Column('talla', sa.String(length=20), nullable=False),
    sa.Column('stock', sa.Integer(), nullable=False),
    sa.CheckConstraint('stock >= 0', name='ck_variantes_stock_no_negativo'),
    sa.ForeignKeyConstraint(['producto_id'], ['productos.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('producto_id', 'talla', name='uq_variantes_producto_talla')
    )
    op.create_index(op.f('ix_variantes_id'), 'variantes', ['id'], unique=False)
    op.create_index(op.f('ix_variantes_producto_id'), 'variantes', ['producto_id'], unique=False)

    # El enum guardaba 'T4' para el talle "4": se le saca la T. 'RN' queda igual.
    op.execute("""
        INSERT INTO variantes (producto_id, talla, stock)
        SELECT id, CASE WHEN talla::text = 'RN' THEN 'RN' ELSE substr(talla::text, 2) END, stock
        FROM productos
    """)

    # Los items de carritos y pedidos pasan de apuntar al producto a apuntar a su variante.
    for tabla in TABLAS_DE_ITEMS:
        op.add_column(tabla, sa.Column('variante_id', sa.Integer(), nullable=True))
        op.execute(f"""
            UPDATE {tabla} SET variante_id = variantes.id
            FROM variantes WHERE variantes.producto_id = {tabla}.producto_id
        """)
        op.alter_column(tabla, 'variante_id', nullable=False)
        op.create_foreign_key(None, tabla, 'variantes', ['variante_id'], ['id'])
        op.drop_column(tabla, 'producto_id')

    op.drop_constraint('ck_productos_stock_no_negativo', 'productos', type_='check')
    op.drop_column('productos', 'stock')
    op.drop_column('productos', 'talla')
    sa.Enum(name='talla').drop(op.get_bind(), checkfirst=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Volver atras pierde informacion: el esquema anterior solo admite un talle por
    # producto. Se conserva el primer talle de cada producto, con el stock sumado de
    # todos; un producto sin talles queda como T10 con stock 0. Falla si algun talle
    # no existia en el enum anterior.
    talla = sa.Enum(*TALLAS_ENUM, name='talla')
    talla.create(op.get_bind(), checkfirst=True)
    op.add_column('productos', sa.Column('talla', talla, nullable=True))
    op.add_column('productos', sa.Column('stock', sa.Integer(), nullable=True))
    op.execute("""
        UPDATE productos SET
            talla = COALESCE((
                SELECT (CASE WHEN v.talla = 'RN' THEN 'RN' ELSE 'T' || v.talla END)::talla
                FROM variantes v WHERE v.producto_id = productos.id ORDER BY v.id LIMIT 1
            ), 'T10'),
            stock = COALESCE((SELECT sum(v.stock) FROM variantes v WHERE v.producto_id = productos.id), 0)
    """)
    op.alter_column('productos', 'talla', nullable=False)
    op.alter_column('productos', 'stock', nullable=False)
    op.create_check_constraint('ck_productos_stock_no_negativo', 'productos', 'stock >= 0')

    for tabla in TABLAS_DE_ITEMS:
        op.add_column(tabla, sa.Column('producto_id', sa.Integer(), nullable=True))
        op.execute(f"""
            UPDATE {tabla} SET producto_id = variantes.producto_id
            FROM variantes WHERE variantes.id = {tabla}.variante_id
        """)
        op.alter_column(tabla, 'producto_id', nullable=False)
        op.create_foreign_key(None, tabla, 'productos', ['producto_id'], ['id'])
        op.drop_column(tabla, 'variante_id')

    op.drop_index(op.f('ix_variantes_producto_id'), table_name='variantes')
    op.drop_index(op.f('ix_variantes_id'), table_name='variantes')
    op.drop_table('variantes')
