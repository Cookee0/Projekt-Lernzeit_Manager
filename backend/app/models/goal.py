from datetime import datetime, timezone

from ..extensions import db

VALID_STATUSES = ("open", "in_progress", "achieved")


class Goal(db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    target_date = db.Column(db.Date, nullable=False)
    module_name = db.Column(db.String(255), nullable=False)
    ects = db.Column(db.Integer, default=5)
    status = db.Column(db.String(50), default="open")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="goals")
    plan_slots = db.relationship("PlanSlot", back_populates="goal", cascade="all, delete-orphan")
    study_sessions = db.relationship(
        "StudySession", back_populates="goal", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "target_date": self.target_date.isoformat(),
            "module_name": self.module_name,
            "ects": self.ects,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
