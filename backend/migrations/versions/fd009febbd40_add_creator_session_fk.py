"""Add creator session FK

Revision ID: fd009febbd40
Revises: f6b529db3246
Create Date: 2026-10-08 01:15:54.395845

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd009febbd40'
down_revision: Union[str, Sequence[str], None] = 'f6b529db3246'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('creator_sessions') as batch_op:
        batch_op.create_foreign_key('fk_creator_sessions_creators', 'creators', ['creator_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('creator_sessions') as batch_op:
        batch_op.drop_constraint('fk_creator_sessions_creators', type_='foreignkey')
