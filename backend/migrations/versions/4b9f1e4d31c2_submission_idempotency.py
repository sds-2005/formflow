"""Enforce per-form submission idempotency.

Revision ID: 4b9f1e4d31c2
Revises: fd009febbd40
"""

from typing import Sequence, Union

from alembic import op

revision: str = "4b9f1e4d31c2"
down_revision: Union[str, Sequence[str], None] = "fd009febbd40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("submissions") as batch_op:
        batch_op.create_unique_constraint(
            "uq_submission_form_idempotency", ["form_id", "idempotency_key"]
        )


def downgrade() -> None:
    with op.batch_alter_table("submissions") as batch_op:
        batch_op.drop_constraint("uq_submission_form_idempotency", type_="unique")
