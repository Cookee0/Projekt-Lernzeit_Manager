"""Lernziel um Prioritaet, Note und Ergebnis-Notiz erweitern

Revision ID: 0002_goal_prioritaet_ergebnis
Revises: 0001_ms4_initial_schema
Create Date: 2026-08-17

priority bedient FR-1.4, grade und result_note bedienen FR-5.2.
Alle drei Spalten sind optional (nullable), damit bestehende Lernziele
unveraendert gueltig bleiben.

Die Revision-ID ist kuerzer als im urspruenglichen Plan vorgesehen
("...und_ergebnis" statt "...und_ergebnis"): Die Spalte alembic_version.
version_num ist standardmaessig varchar(32), und die urspruenglich
geplante ID war mit 33 Zeichen einen zu lang - flask db upgrade brach
mit "StringDataRightTruncation" ab.
"""

import sqlalchemy as sa
from alembic import op

revision = "0002_goal_prioritaet_ergebnis"
down_revision = "0001_ms4_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("goals", sa.Column("priority", sa.String(length=10), nullable=True))
    op.add_column("goals", sa.Column("grade", sa.String(length=10), nullable=True))
    op.add_column("goals", sa.Column("result_note", sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column("goals", "result_note")
    op.drop_column("goals", "grade")
    op.drop_column("goals", "priority")
