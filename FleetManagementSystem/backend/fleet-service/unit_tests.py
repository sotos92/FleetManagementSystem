import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Driver Tests
def test_create_driver():
    response = client.post("/drivers/", json={"name": "Test Driver", "license_number": "XYZ123"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Driver"
    assert data["license_number"] == "XYZ123"

def test_get_drivers():
    response = client.get("/drivers/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_driver():
    driver = client.post("/drivers/", json={"name": "Original Driver", "license_number": "ORIG123"}).json()
    response = client.put(f"/drivers/{driver['id']}", json={"name": "Updated Driver", "license_number": "UPDATED123"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Driver"
    assert data["license_number"] == "UPDATED123"

def test_delete_driver():
    driver = client.post("/drivers/", json={"name": "Delete Driver", "license_number": "DEL123"}).json()
    response = client.delete(f"/drivers/{driver['id']}")
    assert response.status_code == 200
    assert response.json()["message"] == "Driver deleted successfully"

# Car Tests
def test_create_car():
    response = client.post("/cars/", json={"model": "Test Model", "license_plate": "TEST123"})
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "Test Model"
    assert data["license_plate"] == "TEST123"

def test_get_cars():
    response = client.get("/cars/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_update_car():
    car = client.post("/cars/", json={"model": "Update Model", "license_plate": "UPDATE123"}).json()
    response = client.put(f"/cars/{car['id']}", json={"model": "Updated Model", "license_plate": "UPDATED123"})
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "Updated Model"
    assert data["license_plate"] == "UPDATED123"

def test_delete_car():
    car = client.post("/cars/", json={"model": "Delete Model", "license_plate": "DELETE123"}).json()
    response = client.delete(f"/cars/{car['id']}")
    assert response.status_code == 200
    assert response.json()["message"] == "Car deleted successfully"

# Trip Tests
def test_create_trip():
    car = client.post("/cars/", json={"model": "Trip Model", "license_plate": "TRIP123"}).json()
    response = client.post("/trips/", json={
        "description": "Test Trip",
        "car_id": car["id"],
        "shift": "Day",
        "destination_lat": 35.0,
        "destination_long": 34.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Test Trip"
    assert data["shift"] == "Day"

def test_get_trips():
    response = client.get("/trips/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# Assignment Tests
def test_assign_driver_to_car():
    driver = client.post("/drivers/", json={"name": "Driver 1", "license_number": "D123"}).json()
    car = client.post("/cars/", json={"model": "Car Model", "license_plate": "C123"}).json()
    response = client.post("/assign/", json={"car_id": car["id"], "driver_id": driver["id"]})
    assert response.status_code == 200
    assert response.json()["message"] == "Driver assigned to car successfully"

def test_assign_nonexistent_driver():
    car = client.post("/cars/", json={"model": "Edge Model", "license_plate": "EDGE123"}).json()
    response = client.post("/assign/", json={"car_id": car["id"], "driver_id": 99999})
    assert response.status_code == 404
    assert response.json()["detail"] == "Driver not found"

