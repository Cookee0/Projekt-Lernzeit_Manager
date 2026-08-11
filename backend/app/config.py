import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.environ.get("SECRET_KEY", "change-me-jwt"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = ["http://localhost:4200"]


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://lernzeit:lernzeit_dev@localhost:5432/lernzeit",
    )


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_by_name: dict[str, type[Config]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}
