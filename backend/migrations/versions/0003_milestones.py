"""Zwischenziele je Monat (FR-3.2)

Revision ID: 0003_milestones
Revises: 0002_goal_prioritaet_ergebnis
Create Date: 2026-08-17

Ein Zwischenziel ist ein kurzfristiges Arbeitspaket innerhalb eines Monats,
zum Beispiel "Kapitel 3 abschliessen". Es haengt optional an einem Lernziel.
Monat und Jahr sind ganze Zahlen - genau wie in plan_slots, damit beide
Tabellen mit demselben Filter abgefragt werden koennen.
"""

import sqlalchemy as sa
from alembic import op

revision = "0003_milestones"
down_revision = "0002_goal_prioritaet_ergebnis"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "milestones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("goal_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("due_day", sa.Integer(), nullable=True),
        sa.Column("done", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("milestones")
