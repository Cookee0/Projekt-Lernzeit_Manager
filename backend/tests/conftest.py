import pytest
from flask.testing import FlaskClient

from app import create_app


@pytest.fixture
def app():
    return create_app("testing")


@pytest.fixture
def client(app) -> FlaskClient:
    return app.test_client()
