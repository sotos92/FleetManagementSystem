from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text
from typing import Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Database configuration
DATABASE_URL = "postgresql://postgres:password@db:5432/fleet_db"

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)

# FastAPI instance
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas (Request and Response Models)
class CarBase(BaseModel):
    id: int
    model: str
    license_plate: str
    geo_lat: float
    geo_long: float

class TripBase(BaseModel):
    id: int
    description: str
    shift: str
    destination_lat: Optional[float]
    destination_long: Optional[float]
    car: Optional[CarBase]

# Endpoint to fetch trip by ID
@app.get("/trips/{trip_id}", response_model=TripBase)
def get_trip(trip_id: int):
    query = text("""
        SELECT
            trips.id AS trip_id,
            trips.description,
            trips.shift,
            trips.destination_lat,
            trips.destination_long,
            cars.id AS car_id,
            cars.model,
            cars.license_plate,
            cars.geo_lat,
            cars.geo_long
        FROM trips
        LEFT JOIN cars ON trips.car_id = cars.id
        WHERE trips.id = :trip_id
    """)

    with engine.connect() as connection:
        connection = connection.execution_options(stream_results=True)
        result = connection.execute(query, {"trip_id": trip_id}).mappings().fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        # Construct response
        return TripBase(
            id=result["trip_id"],
            description=result["description"],
            shift=result["shift"],
            destination_lat=result["destination_lat"],
            destination_long=result["destination_long"],
            car=CarBase(
                id=result["car_id"],
                model=result["model"],
                license_plate=result["license_plate"],
                geo_lat=result["geo_lat"],
                geo_long=result["geo_long"],
            ) if result["car_id"] else None
        )

