from datetime import datetime, timezone

from ..extensions import db


class Goal(db.Model):
    """Ein Lernziel mit Titel, Modul, Zieldatum und Status (FR-1.1, FR-1.2)."""

    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    module = db.Column(db.String(100), nullable=False)
    target_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="offen")
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
            "module": self.module,
            "target_date": self.target_date.isoformat(),
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
