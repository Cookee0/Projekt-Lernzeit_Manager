
from ..extensions import db
from ..time_utils import iso_utc


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
            "started_at": iso_utc(self.started_at),
            "paused_at": iso_utc(self.paused_at),
            "total_paused_seconds": self.total_paused_seconds,
            "ended_at": iso_utc(self.ended_at),
            "duration_seconds": self.duration_seconds,
            "status": self.status,
            "note": self.note,
        }
