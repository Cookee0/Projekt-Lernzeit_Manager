from ..extensions import db


class PlanSlot(db.Model):
    __tablename__ = "plan_slots"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    goal_id = db.Column(db.Integer, db.ForeignKey("goals.id"), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    month = db.Column(db.Integer, nullable=False)
    day = db.Column(db.Integer, nullable=True)
    planned_time = db.Column(db.String(5), nullable=True)  # "HH:MM"
    duration_minutes = db.Column(db.Integer, nullable=False, default=60)
    note = db.Column(db.String(500), nullable=True)

    user = db.relationship("User", back_populates="plan_slots")
    goal = db.relationship("Goal", back_populates="plan_slots")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "goal_id": self.goal_id,
            "year": self.year,
            "month": self.month,
            "day": self.day,
            "planned_time": self.planned_time,
            "duration_minutes": self.duration_minutes,
            "note": self.note,
        }
