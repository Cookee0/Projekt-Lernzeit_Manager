from datetime import datetime, timezone

from ..extensions import db


class Goal(db.Model):
    """Ein Lernziel mit Titel und Zieldatum (FR-1.1)."""

    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    target_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> dict:
        """Wandelt das Lernziel in ein JSON-taugliches Dictionary um."""
        return {
            "id": self.id,
            "title": self.title,
            "target_date": self.target_date.isoformat(),
            "created_at": self.created_at.isoformat(),
        }
