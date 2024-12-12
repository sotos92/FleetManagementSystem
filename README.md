# Fleet Management System (FMS)

## Overview
The Fleet Management System (FMS) is a web-based application designed for managing and monitoring a fleet of vehicles and their drivers. It consists of a front-end interface and two backend microservices:

- **Frontend:** An application for managing fleet entities (drivers and cars) and monitoring their locations in real-time.
- **Backend Microservices:**
  - `fleet-service`: Provides CRUD operations for managing fleet entities and assigning drivers to cars.
  - `fleet-simulator`: Simulates vehicle movement and generates real-time updates.

## Features
### Manage Fleet
- Create, view, and edit drivers and cars.
- Assign drivers to cars.
- Create trips.

### Monitor Fleet
- Display the real-time location of cars on a map.
- View trip details and assignments.

## API Documentation
- Comprehensive RESTful APIs for managing data and simulations.
- API documentation is available at:
  - `fleet-service`: [http://localhost:8000/docs#/](http://localhost:8000/docs#/)
  - `fleet-simulator`: [http://localhost:8001/docs#/](http://localhost:8001/docs#/)

## Prerequisites
Ensure you have the following installed:
- Docker and Docker Compose
- A modern web browser for accessing the frontend

## Setup and Installation
### Step 1: Clone the Repository
Clone the project repository to your local machine:
```bash
# Example
$ git clone https://github.com/sotos92/FleetManagementSystem.git
$ cd FleetManagementSystem
```

### Step 2: Run the Application
Use Docker Compose to set up and run the application:
```bash
$ docker-compose up --build
```

This command builds and runs all required services:
- `fleet-service` (Port: 8000)
- `fleet-simulator` (Port: 8001)
- PostgreSQL database

### Step 3: Access the Frontend
Open your browser and navigate to:
```
frontend/index.html
```
This is the starting point for interacting with the Fleet Management System.

## Directory Structure
```
FleetManagementSystem
├── backend
│   ├── fleet-service
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── fleet-simulator
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
├── frontend
│   ├── index.html
│   ├── script.js
│   ├── trips.html
├── docker-compose.yml
└── README.md
```

## Testing
Automated unit tests are included for the backend services. To run the tests:
```bash
$ cd backend/fleet-service
$ pytest unit_tests.py
```

## Additional Information
- Default database credentials:
  - **User:** `postgres`
  - **Password:** `password`
  - **Database:** `fleet_db`
- The application is configured for CORS to allow cross-origin requests.

## Extra Added Features
- Responsive user-friendly design for the frontend.
- Searching/Paging/Ordering mechanisms incorporated in cars and drivers dataTables.
- When a driver gets deleted the associated linked car automatically gets updated.
- When a car is deleted the associated linked trip automatically gets also deleted.
- Regex checks on drivers, cars, and trips.
- No duplicate license numbers for drivers and license plates for cars are allowed by the system.
- When multiple markers exist on the exact same position on the map a cluster approach is employed to properly display all of them.


