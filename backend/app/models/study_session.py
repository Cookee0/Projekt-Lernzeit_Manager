
from ..extensions import db


class StudySession(db.Model):
    __tablename__ = "study_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    goal_id = db.Column(db.Integer, db.ForeignKey("goals.id"), nullable=False)
    started_at = db.Column(db.DateTime, nullable=False)
    paused_at = db.Column(db.DateTime, nullable=True)
    total_paused_seconds = db.Column(db.Integer, default=0)
    ended_at = db.Column(db.DateTime, nullable=True)
    duration_seconds = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), default="active")  # active | paused | completed
    note = db.Column(db.Text, nullable=True)

    user = db.relationship("User", back_populates="study_sessions")
    goal = db.relationship("Goal", back_populates="study_sessions")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "goal_id": self.goal_id,
            "started_at": self.started_at.isoformat(),
            "paused_at": self.paused_at.isoformat() if self.paused_at else None,
            "total_paused_seconds": self.total_paused_seconds,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "duration_seconds": self.duration_seconds,
            "status": self.status,
            "note": self.note,
        }
