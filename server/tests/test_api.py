from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_read_root():
    """
    Test the root endpoint.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

def test_predict():
    """
    Test the predict endpoint.
    """
    response = client.get("/predict")
    assert response.status_code == 200
    assert "prediction" in response.json()

def test_scrape():
    """
    Test the scrape endpoint.
    """
    response = client.get("/scrape?url=http://example.com")
    assert response.status_code == 200
    assert "data" in response.json()
