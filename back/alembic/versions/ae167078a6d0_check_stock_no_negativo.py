"""check stock no negativo

Revision ID: ae167078a6d0
Revises: 2dd73b255e88
Create Date: 2026-09-29 14:36:26.067975

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae167078a6d0'
down_revision: Union[str, Sequence[str], None] = '2dd73b255e88'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Escrita a mano: el autogenerate de Alembic no detecta restricciones CHECK.
    op.create_check_constraint("ck_productos_stock_no_negativo", "productos", "stock >= 0")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_productos_stock_no_negativo", "productos", type_="check")
