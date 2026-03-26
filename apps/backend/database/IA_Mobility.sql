DROP TABLE IF EXISTS external_data CASCADE;
DROP TABLE IF EXISTS parking_predictions CASCADE;
DROP TABLE IF EXISTS parkings CASCADE;
DROP TABLE IF EXISTS optimized_routes CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    google_id VARCHAR(255),
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT,
    session_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE locations (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    address VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

CREATE TABLE trips (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT,
    start_location_id INT,
    end_location_id INT,
    departure_time TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (start_location_id) REFERENCES locations(id),
    FOREIGN KEY (end_location_id) REFERENCES locations(id)
);

CREATE TABLE optimized_routes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id INT,
    duration INT,
    distance INT,
    traffic_level VARCHAR(50),
    weather_condition VARCHAR(50),
    score REAL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE parkings (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    capacity INT,
    available_spots INT
);

CREATE TABLE parking_predictions (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parking_id INT,
    predicted_available_spots INT,
    confidence REAL,
    prediction_time TIMESTAMP,
    FOREIGN KEY (parking_id) REFERENCES parkings(id) ON DELETE CASCADE
);

CREATE TABLE external_data (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    location_id INT,
    traffic_level VARCHAR(50),
    weather VARCHAR(50),
    temperature REAL,
    recorded_at TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id)
);