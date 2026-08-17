from datetime import datetime, timezone

from ..extensions import db
from ..time_utils import iso_utc


class Milestone(db.Model):
    """Ein monatliches Zwischenziel (FR-3.2).

    Abgegrenzt zum Lernziel (Goal): Ein Zwischenziel ist ein kurzfristiges
    Arbeitspaket innerhalb eines Monats - "Kapitel 3 abschliessen" - ohne
    Note, ohne Prioritaet und ohne Fortschrittsrechnung. Das Lernziel
    spannt dagegen den Sechs-Monats-Horizont.
    """

    __tablename__ = "milestones"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    goal_id = db.Column(db.Integer, db.ForeignKey("goals.id"), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    due_day = db.Column(db.Integer, nullable=True)
    done = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="milestones")
    goal = db.relationship("Goal", back_populates="milestones")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "goal_id": self.goal_id,
            "title": self.title,
            "year": self.year,
            "month": self.month,
            "due_day": self.due_day,
            "done": self.done,
            "created_at": iso_utc(self.created_at),
        }
