from fastapi.testclient import TestClient
from web.backend.main import app


def test_health():
    response = TestClient(app).get('/')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'
