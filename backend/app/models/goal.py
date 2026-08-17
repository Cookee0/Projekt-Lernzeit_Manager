from datetime import datetime, timezone

from ..extensions import db
from ..time_utils import iso_utc

VALID_STATUSES = ("open", "in_progress", "achieved")
VALID_PRIORITIES = ("high", "medium", "low")


class Goal(db.Model):
    __tablename__ = "goals"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    target_date = db.Column(db.Date, nullable=False)
    module_name = db.Column(db.String(255), nullable=False)
    ects = db.Column(db.Integer, default=5)
    status = db.Column(db.String(50), default="open")
    priority = db.Column(db.String(10), nullable=True)
    grade = db.Column(db.String(10), nullable=True)
    result_note = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="goals")
    plan_slots = db.relationship("PlanSlot", back_populates="goal", cascade="all, delete-orphan")
    study_sessions = db.relationship(
        "StudySession", back_populates="goal", cascade="all, delete-orphan"
    )
    milestones = db.relationship("Milestone", back_populates="goal")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "target_date": self.target_date.isoformat(),
            "module_name": self.module_name,
            "ects": self.ects,
            "status": self.status,
            "priority": self.priority,
            "grade": self.grade,
            "result_note": self.result_note,
            "created_at": iso_utc(self.created_at),
        }
