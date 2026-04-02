# Weather Service Documentation

## Overview

The Weather Service provides weather data using a **fault-tolerant multi-provider approach**. It ensures high availability by attempting multiple external weather providers in sequence and logging all interactions for traceability.

---

## API Documentation (Swagger)

Interactive API documentation is available via Swagger UI:

```
http://localhost:3000/api
```

### Features

* Test the `/weather` endpoint directly from the browser
* View all request parameters and validation rules
* See example responses (success and error)
* Understand HTTP status codes and error handling
* Explore API structure without external tools

---

## Endpoint

### GET /weather

Retrieves current weather data based on either a city name or geographic coordinates.

---

## Request Parameters

The endpoint accepts **one of the following options**:

### Option 1: City Name

* `city` (string)

Example:

```
/weather?city=Amman
```

### Option 2: Coordinates

* `lat` (number)
* `lon` (number)

Example:

```
/weather?lat=31.95&lon=35.91
```

### Validation Rules

* You must provide **either**:

  * `city`
  * OR `lat` and `lon`
* Providing both or none will result in:

```
400 Bad Request
```

---

## System Workflow

### 1. Input Validation

The system first validates the request to ensure correct input format.

---

### 2. Provider Execution (Primary → Fallback)

The system uses multiple weather providers in a defined order:

1. Primary Provider (e.g., Tomorrow.io)
2. Secondary Provider (e.g., WeatherAPI)

#### Process:

* The system first attempts to fetch data from the **primary provider**.
* If it fails (timeout, API error, or invalid data), the system automatically retries using the **secondary provider**.

---

### 3. Data Validation

A provider response is considered valid only if it includes:

* Temperature
* Humidity
* Weather description

If any of these fields are missing, the provider is treated as **failed**, and the fallback mechanism is triggered.

---

### 4. Logging

All requests and provider attempts are logged in the database:

#### WeatherRequest Table

* Stores input parameters (city or coordinates)
* Stores selected provider (if successful)
* Stores weather data (if available)
* Stores final status or error description

#### ProviderLog Table

* Provider name
* Success or failure status
* Error message (if failed)
* Start and finish timestamps
* Linked weather request ID

---

### 5. Successful Response

If any provider succeeds:

```json
{
  "provider": "Tomorrow.io",
  "weather": {
    "temperature": 25,
    "humidity": 60,
    "description": "Clear sky"
  },
  "location": {
    "city": "Amman"
  },
  "timestamp": "2026-04-02T12:00:00Z"
}
```

---

### 6. Failure Handling

If **all providers fail**, the system:

1. Generates a unique error identifier (UUID)
2. Logs all failures
3. Returns a generic error response

```json
{
  "message": "All weather providers failed",
  "errorId": "a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```


---


---

### Server is running using Doker 

docker compose up --build

or by using build.sh file 
write 
./build.sh weather-service

---

### Test cases 

docker exec -it weather-service npm run test

---


