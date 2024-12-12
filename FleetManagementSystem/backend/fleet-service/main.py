from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session, joinedload
from sqlalchemy.orm import backref
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os


# Read database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/fleet_db")

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI instance
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    license_number = Column(String, unique=True, index=True)
    cars = relationship("Car", back_populates="driver", cascade="save-update")

class Car(Base):
    __tablename__ = "cars"
    id = Column(Integer, primary_key=True, index=True)
    model = Column(String, index=True)
    license_plate = Column(String, unique=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)
    geo_lat = Column(Float, nullable=True, default=34.70035)
    geo_long = Column(Float, nullable=True, default=33.06171)
    driver = relationship("Driver", back_populates="cars")
    trips = relationship("Trip", back_populates="car", cascade="all, delete")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    car_id = Column(Integer, ForeignKey("cars.id", ondelete="CASCADE"), nullable=False)
    shift = Column(String, nullable=False)
    destination_lat = Column(Float, nullable=True)
    destination_long = Column(Float, nullable=True)
    car = relationship("Car", back_populates="trips")

# Pydantic Models (Request and Response models)
class DriverBase(BaseModel):
    name: str
    license_number: str

class DriverResponse(DriverBase):
    id: int
    class Config:
        orm_mode = True

class CarBase(BaseModel):
    model: str
    license_plate: str

class CarResponse(CarBase):
    id: int
    driver_id: Optional[int]
    geo_lat: Optional[float]
    geo_long: Optional[float]
    driver: Optional[DriverResponse]
    class Config:
        orm_mode = True

class AssignDriverRequest(BaseModel):
    car_id: int
    driver_id: int

class TripBase(BaseModel):
    description: str
    car_id: int
    shift: str
    destination_lat: Optional[float]
    destination_long: Optional[float]

class TripResponse(TripBase):
    id: int
    car: Optional[CarResponse]
    class Config:
        orm_mode = True

# Database Initialization
Base.metadata.create_all(bind=engine)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# CRUD Operations
@app.get("/cars/", response_model=List[CarResponse])
def get_cars(db: Session = Depends(get_db)):
    return db.query(Car).options(joinedload(Car.driver)).all()

@app.post("/drivers/", response_model=DriverResponse)
def create_driver(driver: DriverBase, db: Session = Depends(get_db)):
    new_driver = Driver(name=driver.name, license_number=driver.license_number)
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@app.get("/drivers/", response_model=List[DriverResponse])
def get_drivers(db: Session = Depends(get_db)):
    return db.query(Driver).all()

@app.put("/drivers/{driver_id}", response_model=DriverResponse)
def update_driver(driver_id: int, updated_driver: DriverBase, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    driver.name = updated_driver.name
    driver.license_number = updated_driver.license_number
    db.commit()
    db.refresh(driver)
    return driver

@app.delete("/drivers/{driver_id}")
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.delete(driver)
    db.commit()
    return {"message": "Driver deleted successfully"}

@app.post("/cars/", response_model=CarResponse)
def create_car(car: CarBase, db: Session = Depends(get_db)):
    new_car = Car(model=car.model, license_plate=car.license_plate)
    db.add(new_car)
    db.commit()
    db.refresh(new_car)
    return new_car

@app.put("/cars/{car_id}", response_model=CarResponse)
def update_car(car_id: int, updated_car: CarBase, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    car.model = updated_car.model
    car.license_plate = updated_car.license_plate
    db.commit()
    db.refresh(car)
    return car

@app.delete("/cars/{car_id}")
def delete_car(car_id: int, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    db.delete(car)
    db.commit()
    return {"message": "Car deleted successfully"}

@app.post("/assign/")
def assign_driver_to_car(
    request: AssignDriverRequest,  # Use the request body model
    db: Session = Depends(get_db)
):
    car = db.query(Car).filter(Car.id == request.car_id).first()
    driver = db.query(Driver).filter(Driver.id == request.driver_id).first()

    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    car.driver_id = driver.id
    db.commit()
    db.refresh(car)
    return {"car_id": car.id, "driver_id": driver.id, "message": "Driver assigned to car successfully"}

@app.post("/trips/", response_model=TripResponse)
def create_trip(trip: TripBase, db: Session = Depends(get_db)):
    new_trip = Trip(
        description=trip.description,
        car_id=trip.car_id,
        shift=trip.shift,
        destination_lat=trip.destination_lat,
        destination_long=trip.destination_long,
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@app.get("/trips/", response_model=List[TripResponse])
def get_trips(db: Session = Depends(get_db)):
    trips = db.query(Trip).options(joinedload(Trip.car).joinedload(Car.driver)).all()
    return trips

@app.delete("/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}
