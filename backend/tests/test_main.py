from fastapi.testclient import TestClient
from art_ai.main import app

client = TestClient(app)

def test_home_route():
    response = client.get("/")
    assert response.status_code == 200
    assert "ART-AI Platform" in response.text
    assert "FastAPI Backend" in response.text


def test_cors_headers_for_frontend_origin():
    response = client.options(
        "/",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
