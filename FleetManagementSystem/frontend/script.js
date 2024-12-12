const API_BASE_URL = "http://localhost:8000";
const API_BASE_URL_SIMULATION = "http://localhost:8001";
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoic2NvbnN0MDEiLCJhIjoiY20xZ2N1M2xlMDIxazJrc2U1dnhuaGc4MCJ9.5P0eR7TDFJQYiWGXi0mCsg";

$(document).ready(function () {
    let driversTable, carsTable, tripsTable;
	let map, vehicleMarker, destinationMarker, routeLine;
	let carMarkersCluster;
    

    // Initialize DataTables for Drivers, Cars, and Trips
    function initializeDataTables() {
        if ($.fn.DataTable.isDataTable("#drivers-table")) {
            $("#drivers-table").DataTable().destroy();
        }
        if ($.fn.DataTable.isDataTable("#cars-table")) {
            $("#cars-table").DataTable().destroy();
        }
		if ($.fn.DataTable.isDataTable("#trips-table")) {
            $("#trips-table").DataTable().destroy();
        }

        driversTable = $("#drivers-table").DataTable({
            paging: true,
            searching: true,
            ordering: true,
        });

        carsTable = $("#cars-table").DataTable({
            paging: true,
            searching: true,
            ordering: true,
        });
		
		tripsTable = $("#trips-table").DataTable({
            paging: true,
            searching: true,
            ordering: true,
        });
    }

    // Fetch and display drivers    
	function fetchDrivers() {
		$.ajax({
			url: `${API_BASE_URL}/drivers/`, 
			type: "GET",
			success: function (data) {
				//update the dropdown
                $("#driver-select").empty().append('<option value="">Select Driver</option>');
            data.forEach(driver => {
                $("#driver-select").append(
                    `<option value="${driver.id}">${driver.name} - ${driver.license_number}</option>`
                );
            });
				    
				const driversTable = $("#drivers-table").DataTable();
				driversTable.clear(); // Clear existing rows

				data.forEach(driver => {
					driversTable.row.add([
						driver.id,
						driver.name,
						driver.license_number,
						`
							<button class="btn btn-warning btn-sm edit-driver" 
								data-id="${driver.id}" 
								data-name="${driver.name}" 
								data-license="${driver.license_number}">
								Edit
							</button>
							<button class="btn btn-danger btn-sm delete-driver" 
								data-id="${driver.id}">
								Delete
							</button>
						`
					]);
				});

				driversTable.draw(); // Redraw the table
			},
			error: function () {
				alert("Failed to fetch drivers. Please check your backend service.");
			},
		});
	}
	


    // Fetch and display cars
    function fetchCars() {
    $.ajax({
        url: `${API_BASE_URL}/cars/`,
        type: "GET",
        success: function (data) {
            // Update the car dropdown
            $("#car-select").empty().append('<option value="">Select Car</option>');
            data.forEach(car => {
                $("#car-select").append(
                    `<option value="${car.id}">${car.model} - ${car.license_plate}</option>`
                );
            });

            // Update the cars table
            const carsTable = $("#cars-table").DataTable();
            carsTable.clear(); // Clear existing rows

            data.forEach(car => {
                carsTable.row.add([
                    car.id,
                    car.model,
                    car.license_plate,
                    car.driver
                        ? `${car.driver.name} (License: ${car.driver.license_number})`
                        : "Unassigned",
                    `
                        <button class="btn btn-warning btn-sm edit-car" 
                            data-id="${car.id}" 
                            data-model="${car.model}" 
                            data-license="${car.license_plate}">
                            Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-car" 
                            data-id="${car.id}">
                            Delete
                        </button>
                    `
                ]);
            });

            carsTable.draw(); // Redraw the table
        },
        error: function () {
            alert("Failed to fetch cars. Please check your backend service.");
        },
		});
	}

	
	// Fetch and display trips
	function fetchTrips() {
    $.ajax({
        url: `${API_BASE_URL}/trips/`,
        type: "GET",
        success: function (data) {
            tripsTable.clear(); // Clear existing data
            data.forEach((trip) => {
                const carInfo = trip.car
                    ? `${trip.car.model} (License: ${trip.car.license_plate})`
                    : "Unknown Car";

                tripsTable.row.add([
                    trip.id,
                    trip.description,
                    carInfo,
                    trip.shift,
                    trip.destination_lat || "N/A",
                    trip.destination_long || "N/A",
                    `
                        <button class="btn btn-sm btn-danger delete-trip" data-id="${trip.id}">Delete</button><br><br>
                        <button class="btn btn-sm btn-primary simulate-trip" data-id="${trip.id}">Simulate</button>
                    `,
                ]);
            });
            tripsTable.draw(); // Redraw the table
        },
        error: function () {
            alert("Failed to fetch trips. Please check your backend service.");
        },
    });
}


	
	// Add a new trip
    $("#add-trip").click(function () {
        const description = $("#trip-description").val();
        const carId = $("#car-select").val();
        const shift = $("#trip-shift").val();
        const destinationLat = $("#trip-destination-lat").val();
        const destinationLong = $("#trip-destination-long").val();
		 // Regex for validating latitude and longitude
		const latLonRegex = /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/; // Latitude: -90 to 90
		const lonRegex = /^-?(1[0-7]\d(\.\d+)?|180(\.0+)?|(\d{1,2})(\.\d+)?)$/; // Longitude: -180 to 180

        if (!description || !carId || !shift) {
            alert("Please fill out all required fields to add a trip.");
            return;
        }
		
		if (!latLonRegex.test(destinationLat)) {
			alert("Invalid latitude. Please enter a value between -90 and 90.");
			return;
		}

		if (!lonRegex.test(destinationLong)) {
			alert("Invalid longitude. Please enter a value between -180 and 180.");
			return;
		}
		
        $.ajax({
            url: `${API_BASE_URL}/trips/`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                description,
                car_id: carId,
                shift,
                destination_lat: destinationLat,
                destination_long: destinationLong,
            }),
            success: function () {
                fetchTrips();
                $("#trip-description").val("");
                $("#trip-shift").val("");
                $("#trip-destination-lat").val("");
                $("#trip-destination-long").val("");
                $("#car-select").val("");
            },
            error: function () {
                alert("Failed to add trip. Please try again.");
            },
        });
    });
	
	// Delete a trip
    $(document).on("click", ".delete-trip", function () {
        const id = $(this).data("id");

        if (!confirm("Are you sure you want to delete this trip?")) {
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/trips/${id}`,
            type: "DELETE",
            success: function () {
                fetchTrips();
            },
            error: function () {
                alert("Failed to delete trip. Please try again.");
            },
        });
    });

    // Add a new driver
    $("#add-driver").click(function () {
        const name = $("#driver-name").val();
        const license = $("#driver-license").val();
		
		// Regex to allow only letters and spaces
		const nameRegex = /^[a-zA-Z\s]+$/; 
		// Regex to allow only alphanumeric characters for license
		const licenseRegex = /^[a-zA-Z0-9]+$/;
	
        if (!name || !license) {
            alert("Please fill out both fields to add a driver.");
            return;
        }
		
		if (!nameRegex.test(name)) {
			alert("Driver name can only contain letters and spaces.");
			return;
		}
		
	    if (!licenseRegex.test(license)) {
			alert("Driver license can only contain letters and numbers.");
			return;
		}

        $.ajax({
            url: `${API_BASE_URL}/drivers/`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ name, license_number: license }),
            success: function () {
                fetchDrivers();
                $("#driver-name").val("");
                $("#driver-license").val("");
            },
            error: function () {
                alert("Failed to add driver. Please try again.");
            },
        });
    });

    // Add a new car
    $("#add-car").click(function () {
        const model = $("#car-model").val();
        const license = $("#car-license").val();
		
		// Regex to allow only alphanumeric characters for model and license
		const checkRegex = /^[a-zA-Z0-9\s]+$/;

        if (!model || !license) {
            alert("Please fill out both fields to add a car.");
            return;
        }
		
		  if (!checkRegex.test(model) || (!checkRegex.test(license))) {
			alert("Car model and license can only contain letters, numbers, and spaces.");
			return;
    }

        $.ajax({
            url: `${API_BASE_URL}/cars/`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ model, license_plate: license }),
            success: function () {
                fetchCars();
                $("#car-model").val("");
                $("#car-license").val("");
            },
            error: function () {
                alert("Failed to add car. Please try again.");
            },
        });
    });

    // Edit a driver - Open the Edit Driver Modal and populate fields
	$(document).on("click", ".edit-driver", function () {
		const driverId = $(this).data("id");
		const driverName = $(this).data("name");
		const driverLicense = $(this).data("license");

		// Populate modal fields
		$("#edit-driver-id").val(driverId);
		$("#edit-driver-name").val(driverName);
		$("#edit-driver-license").val(driverLicense);

		// Show the modal
		$("#editDriverModal").modal("show");
	});

	// Save changes to the driver 
	$(document).on("click", "#save-driver-changes", function () {
    const driverId = $("#edit-driver-id").val(); // Correctly fetch the driver ID
    const driverName = $("#edit-driver-name").val();
    const driverLicense = $("#edit-driver-license").val();
	const nameRegex = /^[a-zA-Z\s]+$/; // Allow only letters and spaces
    const licenseRegex = /^[a-zA-Z0-9]+$/; // Allow only alphanumeric characters

    if (!driverName || !driverLicense) {
        alert("Please fill out all fields.");
        return;
    }
	
	if (!nameRegex.test(driverName)) {
        alert("Driver name can only contain letters and spaces.");
        return;
    }

    if (!licenseRegex.test(driverLicense)) {
        alert("Driver license can only contain letters and numbers.");
        return;
    }

    // Send AJAX request to update the driver
    $.ajax({
        url: `${API_BASE_URL}/drivers/${driverId}`, 
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
            name: driverName,
            license_number: driverLicense,
        }),
        success: function () {
            $("#editDriverModal").modal("hide"); // Close the modal
            fetchDrivers(); // Refresh drivers table
            fetchCars(); // Refresh cars table (since the driver may change)
            alert("Driver updated successfully.");
        },
        error: function () {
            alert("Failed to update driver. Please try again.");
        },
		});
	});



    // Delete a driver
    $(document).on("click", ".delete-driver", function () {
        const id = $(this).data("id");

        if (!confirm("Are you sure you want to delete this driver?")) {
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/drivers/${id}`,
            type: "DELETE",
            success: function () {
                fetchDrivers();
                fetchCars();
                fetchTrips();

            },
            error: function () {
                alert("Failed to delete driver. Please try again.");
            },
        });
    });

    // Edit a car procedure
    $(document).on("click", ".edit-car", function () {
    const carId = $(this).data("id");
    const carModel = $(this).data("model");
    const carLicense = $(this).data("license");

    // Populate modal fields
    $("#edit-car-id").val(carId);
    $("#edit-car-model").val(carModel);
    $("#edit-car-license").val(carLicense);

    // Show the modal
    $("#editCarModal").modal("show");
	});
	
	$(document).on("click", "#save-car-changes", function () {
    const carId = $("#edit-car-id").val();
    const carModel = $("#edit-car-model").val();
    const carLicense = $("#edit-car-license").val();
	const checkRegex = /^[a-zA-Z0-9\s]+$/; // Allow letters, numbers, and spaces
	
    if (!carModel || !carLicense) {
        alert("Please fill out all fields.");
        return;
    }
	
    if (!checkRegex.test(carLicense) || !checkRegex.test(carModel)) {
        alert("Car license and model can only contain letters and numbers.");
        return;
    }

    // Send AJAX request to update the car
    $.ajax({
        url: `${API_BASE_URL}/cars/${carId}`,
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
            model: carModel,
            license_plate: carLicense,
        }),
        success: function () {
            $("#editCarModal").modal("hide"); // Close the modal
            fetchCars(); // Refresh the cars table
            alert("Car updated successfully.");
        },
        error: function () {
            alert("Failed to update car. Please try again.");
        },
		});
	});



    // Delete a car
    $(document).on("click", ".delete-car", function () {
        const id = $(this).data("id");

        if (!confirm("Are you sure you want to delete this car?")) {
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/cars/${id}`,
            type: "DELETE",
            success: function () {
                fetchCars();
                fetchTrips(); //(since trips may be affected by the deleted car)
            },
            error: function () {
                alert("Failed to delete car. Please try again.");
            },
        });
    });

    // Assign a driver to a car
    $("#assign-driver").click(function () {
        const carId = $("#car-select").val();
        const driverId = $("#driver-select").val();

        if (!carId || !driverId) {
            alert("Please select both a car and a driver to assign.");
            return;
        }

        $.ajax({
            url: `${API_BASE_URL}/assign/`,
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ car_id: carId, driver_id: driverId }),
            success: function () {
                fetchCars();
                alert("Driver assigned to car successfully!");
                $("#car-select").val("");
                $("#driver-select").val("");
            },
            error: function () {
                alert("Failed to assign driver to car. Please try again.");
            },
        });
    });

 
	
	//car simulation Processes
    // Initialize the map with Mapbox tiles
    function initializeMap() {
        map = L.map("map").setView([35.0000, 33.0616], 10); // Default center coordinates

        // Add Mapbox tiles to the map
        L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`, {
            attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: MAPBOX_ACCESS_TOKEN,
        }).addTo(map);
    }

    // Validate coordinates before using them
    function isValidCoordinate(lat, long) {
        return lat >= -90 && lat <= 90 && long >= -180 && long <= 180;
    }

    // Update the map with markers and a route
    async function updateMap(vehicleLat, vehicleLong, destLat, destLong) {
    if (!isValidCoordinate(vehicleLat, vehicleLong) || !isValidCoordinate(destLat, destLong)) {
        alert("Invalid coordinates for routing. Unable to display the route.");
        return;
    }

    if (!map) initializeMap();

    // Remove existing markers and route line if they exist
    if (vehicleMarker) map.removeLayer(vehicleMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routeLine) map.removeLayer(routeLine);

    // Add vehicle marker
    vehicleMarker = L.marker([vehicleLat, vehicleLong]).addTo(map).bindPopup("Vehicle Location").openPopup();

    // Add destination marker
    destinationMarker = L.marker([destLat, destLong]).addTo(map).bindPopup("Destination").openPopup();

    // Fetch the route using Mapbox Directions API
    const routeUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${vehicleLong},${vehicleLat};${destLong},${destLat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(routeUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates;

            // Convert GeoJSON coordinates to Leaflet LatLng array
            const latLngs = coordinates.map(([long, lat]) => [lat, long]);

            // Add the route line to the map
            routeLine = L.polyline(latLngs, { color: "blue", weight: 5 }).addTo(map);

            // Adjust map view to fit the route
            map.fitBounds(routeLine.getBounds());

            // Start animating the marker along the route
            animateMarker(latLngs);
        } else {
            alert("Unable to calculate a route. Falling back to straight line.");
            drawFallbackLine(vehicleLat, vehicleLong, destLat, destLong);
        }
    } catch (error) {
        console.error("Error fetching route:", error);
        alert("Unable to fetch the route. Falling back to straight line.");
        drawFallbackLine(vehicleLat, vehicleLong, destLat, destLong);
		}
	}

	// Function to animate the marker along the route
	function animateMarker(latLngs) {
		let index = 0;

		const interval = setInterval(() => {
			if (index >= latLngs.length) {
				clearInterval(interval); // Stop the animation when the destination is reached
				vehicleMarker.bindPopup("Simulation Complete!").openPopup();
				return;
			}

			// Update the marker's position
			vehicleMarker.setLatLng(latLngs[index]);

			index++; // Move to the next coordinate
		}, 1000); // Update position every 1 second
	}

	// Draw a fallback straight line between the waypoints
	function drawFallbackLine(vehicleLat, vehicleLong, destLat, destLong) {
		routeLine = L.polyline(
			[
				[vehicleLat, vehicleLong],
				[destLat, destLong],
			],
			{ color: "red", weight: 4, dashArray: "5, 10" } // Dashed red line for fallback
		).addTo(map);

		map.fitBounds(routeLine.getBounds());
	}


    // Simulate trip button handler
    $(document).on("click", ".simulate-trip", function () {
        const tripId = $(this).data("id");

        // Fetch trip details via AJAX
        $.ajax({
            url: `${API_BASE_URL_SIMULATION}/trips/${tripId}`, 
            type: "GET",
            success: function (trip) {
                // Validate and update map with the trip details
                if (
                    trip.car &&
                    isValidCoordinate(trip.car.geo_lat, trip.car.geo_long) &&
                    isValidCoordinate(trip.destination_lat, trip.destination_long)
                ) {
                    updateMap(trip.car.geo_lat, trip.car.geo_long, trip.destination_lat, trip.destination_long);
                    alert(`Simulating Trip ID: ${trip.id}\nDescription: ${trip.description}`);
                } else {
                    alert("Invalid trip data for mapping. Please check the trip details.");
                }
            },
            error: function () {
                alert("Failed to simulate trip. Please try again.");
            },
        });
    });

    
	
	
	
	//Fetch and display all cars on the map using Marker Clustering
	function showAllCars() {
		// Fetch cars from the API
		$.ajax({
			url: `${API_BASE_URL}/cars/`, 
			type: "GET",
			success: function (cars) {
				// Remove existing car markers cluster if it exists
				if (carMarkersCluster) map.removeLayer(carMarkersCluster);

				// Create a new marker cluster group
				carMarkersCluster = L.markerClusterGroup();

				// Add markers for all cars
				cars.forEach(car => {
					if (isValidCoordinate(car.geo_lat, car.geo_long)) {
						const driverInfo = car.driver 
							? `<br>Driver: ${car.driver.name} <br>License: ${car.driver.license_number}` 
							: `<br>Driver: Not assigned`;

						const marker = L.marker([car.geo_lat, car.geo_long])
							.bindPopup(
								`<b>${car.model}</b><br>License Plate: ${car.license_plate}${driverInfo}`
							);

						carMarkersCluster.addLayer(marker);
					}
				});

				// Add the marker cluster group to the map
				map.addLayer(carMarkersCluster);

				if (carMarkersCluster.getLayers().length > 0) {
					// Adjust map view to fit all car markers
					map.fitBounds(carMarkersCluster.getBounds());
				} else {
					alert("No cars with valid locations found.");
				}
			},
			error: function () {
				alert("Failed to fetch cars. Please check your backend service.");
			},
		});
	}

	// Add event listener to the "Show All Cars" button
	$(document).on("click", "#show-all-cars", function () {
		showAllCars();
	});



	// Clear all markers, clusters, and routes from the map
	function clearMap() {
		// Remove car markers cluster if it exists
		if (carMarkersCluster) {
			map.removeLayer(carMarkersCluster);
			carMarkersCluster = null;
		}

		// Remove individual route-related markers and lines
		if (vehicleMarker) {
			map.removeLayer(vehicleMarker);
			vehicleMarker = null;
		}
		if (destinationMarker) {
			map.removeLayer(destinationMarker);
			destinationMarker = null;
		}
		if (routeLine) {
			map.removeLayer(routeLine);
			routeLine = null;
		}

		alert("All markers and routes have been cleared from the map.");
	}

	// Add event listener to the "Clear Map" button
	$(document).on("click", "#clear-map", function () {
		clearMap();
	});


	// Initial fetch
    fetchDrivers();
    fetchCars();
    fetchTrips();    
    initializeDataTables(); // Initialize DataTables
	initializeMap(); // Initialize the map when the page loads
	



});
