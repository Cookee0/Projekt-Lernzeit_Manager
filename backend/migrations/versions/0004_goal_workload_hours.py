"""Lernziel um manuellen Lernaufwand in Stunden erweitern

Revision ID: 0004_goal_workload_hours
Revises: 0003_milestones
Create Date: 2026-08-21

workload_hours ueberschreibt, falls gesetzt, die Standardformel
ects * 30 Stunden (siehe backend/app/workload.py). Die Spalte ist
nullable, damit bestehende Lernziele unveraendert bei der Formel
bleiben.
"""

import sqlalchemy as sa
from alembic import op

revision = "0004_goal_workload_hours"
down_revision = "0003_milestones"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("goals", sa.Column("workload_hours", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("goals", "workload_hours")
