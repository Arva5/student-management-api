# Student Management REST API

A clean, production-ready RESTful API for managing student records, built with **Node.js**, **Express.js**, and **MongoDB** using **Mongoose**.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
  - [Health Check](#health-check)
  - [Create Student](#1-create-student)
  - [Get All Students](#2-get-all-students)
  - [Get Student by ID](#3-get-student-by-id)
  - [Update Student](#4-update-student)
  - [Delete Student](#5-delete-student)
- [Error Handling & Status Codes](#error-handling--status-codes)
- [Testing](#testing)
- [Postman Collection](#postman-collection)
- [License](#license)

---

## Overview

The **Student Management REST API** provides a backend service for recording, querying, updating, and removing student details. It adheres to RESTful conventions, features strict data validation, enforces uniqueness constraints on emails and identifiers, and provides consistent JSON responses.

---

## Features

- **Full CRUD Operations**: Create, read, update, and delete student records.
- **Auto-Generated Identifiers**: Automatically assigns unique `studentId` strings (e.g. `STU-XXXXXXXX`) upon creation.
- **Dual Identifier Lookups**: Queries support both auto-generated `studentId` and standard MongoDB `_id`.
- **Validation**:
  - `fullName`: Required string (trimmed).
  - `email`: Required, trimmed, lowercase, valid email regex pattern, with unique index constraint.
  - `course`: Required string (trimmed).
  - `age`: Required integer bounded between 1 and 120.
- **Error Handling**:
  - Centralized error-handling middleware.
  - Custom 404 handler for nonexistent routes.
  - Explicit HTTP status codes (`200`, `201`, `400`, `404`, `409`, `500`).
- **Automated End-to-End Testing**: Includes a 21-test suite running against a live MongoDB database instance.

---

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Framework**: [Express.js](https://expressjs.com/) (v5)
- **Database ODM**: [Mongoose](https://mongoosejs.com/) (v9)
- **Configuration**: [dotenv](https://github.com/motdotla/dotenv)
- **Development Tooling**: [nodemon](https://nodemon.io/)
- **Testing Engine**: [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) (official MongoDB engine for automated tests)

---

## Project Structure

```text
student-management-api/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── health.controller.js  # Controller for health-check endpoint
│   │   └── studentController.js  # Student CRUD controllers & validation
│   ├── middleware/
│   │   ├── errorHandler.js       # Centralized global error handler
│   │   └── notFound.js           # 404 Route Not Found middleware
│   ├── models/
│   │   └── Student.js            # Mongoose schema and model definition
│   └── routes/
│       ├── health.routes.js      # Health route definitions
│       └── studentRoutes.js      # Student route definitions
├── .env                          # Local environment variables (git-ignored)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore file (excludes node_modules & .env)
├── package.json                  # Scripts and dependencies
├── package-lock.json             # Locked dependency tree
├── postman_collection.json       # Postman collection with test cases
├── README.md                     # Project documentation
├── server.js                     # Application entry point
└── test_complete_api.js          # Automated end-to-end test runner
```

---

## Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [MongoDB](https://www.mongodb.com/) (local daemon, Docker container, or MongoDB Atlas cluster connection URI)

---

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/student-management-api.git
   cd student-management-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

---

## Environment Variables

Configure the variables inside `.env`:

| Variable | Description | Default Value / Example |
| :--- | :--- | :--- |
| `PORT` | Port for the HTTP server to listen on | `5000` |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/student_management_db` |

> [!NOTE]
> If using **MongoDB Atlas**, set `MONGODB_URI` to your cluster URI:
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/student_management_db?retryWrites=true&w=majority`

---

## Running the Application

### Development Mode (with auto-reload on file changes)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Once started, the server will output:
```text
MongoDB Connected: 127.0.0.1:27017
Server is running in development mode on port 5000
Health check available at: http://localhost:5000/api/health
```

---

## API Documentation

Base URL: `http://localhost:5000`

### Summary of Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | `200` |
| `POST` | `/api/students` | Register a new student | `201`, `400`, `409` |
| `GET` | `/api/students` | Retrieve all student records | `200` |
| `GET` | `/api/students/:id` | Retrieve student by `studentId` or `_id` | `200`, `400`, `404` |
| `PUT` | `/api/students/:id` | Update student details | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/students/:id` | Remove a student record | `200`, `400`, `404` |

---

### Health Check

#### `GET /api/health`
Returns the status, uptime, and current environment of the API.

- **Curl Example**:
  ```bash
  curl http://localhost:5000/api/health
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Student Management API is running smoothly",
    "timestamp": "2026-10-22T01:22:56.000Z",
    "uptime": "12.45 seconds",
    "environment": "development"
  }
  ```

---

### 1. Create Student

#### `POST /api/students`
Creates a new student. Auto-generates a unique `studentId`.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane.doe@example.com",
    "course": "Computer Science",
    "age": 21
  }
  ```
- **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/students \
    -H "Content-Type: application/json" \
    -d "{\"fullName\": \"Jane Doe\", \"email\": \"jane.doe@example.com\", \"course\": \"Computer Science\", \"age\": 21}"
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "Student created successfully",
    "data": {
      "_id": "6716fd90e123456789abcdef",
      "studentId": "STU-A1B2C3D4",
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "course": "Computer Science",
      "age": 21,
      "createdAt": "2026-10-22T01:25:00.000Z",
      "updatedAt": "2026-10-22T01:25:00.000Z"
    }
  }
  ```

---

### 2. Get All Students

#### `GET /api/students`
Retrieves a list of all students sorted by most recently created.

- **Curl Example**:
  ```bash
  curl http://localhost:5000/api/students
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "count": 1,
    "data": [
      {
        "_id": "6716fd90e123456789abcdef",
        "studentId": "STU-A1B2C3D4",
        "fullName": "Jane Doe",
        "email": "jane.doe@example.com",
        "course": "Computer Science",
        "age": 21,
        "createdAt": "2026-10-22T01:25:00.000Z",
        "updatedAt": "2026-10-22T01:25:00.000Z"
      }
    ]
  }
  ```

---

### 3. Get Student by ID

#### `GET /api/students/:id`
Retrieves a single student using their unique `studentId` (e.g. `STU-A1B2C3D4`) or MongoDB `_id`.

- **Curl Example**:
  ```bash
  curl http://localhost:5000/api/students/STU-A1B2C3D4
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "_id": "6716fd90e123456789abcdef",
      "studentId": "STU-A1B2C3D4",
      "fullName": "Jane Doe",
      "email": "jane.doe@example.com",
      "course": "Computer Science",
      "age": 21,
      "createdAt": "2026-10-22T01:25:00.000Z",
      "updatedAt": "2026-10-22T01:25:00.000Z"
    }
  }
  ```

---

### 4. Update Student

#### `PUT /api/students/:id`
Updates one or more fields (`fullName`, `email`, `course`, `age`) for the specified student.

- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fullName": "Jane Smith",
    "course": "Software Engineering",
    "age": 22
  }
  ```
- **Curl Example**:
  ```bash
  curl -X PUT http://localhost:5000/api/students/STU-A1B2C3D4 \
    -H "Content-Type: application/json" \
    -d "{\"fullName\": \"Jane Smith\", \"course\": \"Software Engineering\", \"age\": 22}"
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Student updated successfully",
    "data": {
      "_id": "6716fd90e123456789abcdef",
      "studentId": "STU-A1B2C3D4",
      "fullName": "Jane Smith",
      "email": "jane.doe@example.com",
      "course": "Software Engineering",
      "age": 22,
      "createdAt": "2026-10-22T01:25:00.000Z",
      "updatedAt": "2026-10-22T01:27:00.000Z"
    }
  }
  ```

---

### 5. Delete Student

#### `DELETE /api/students/:id`
Removes the student record matching `studentId` or MongoDB `_id`.

- **Curl Example**:
  ```bash
  curl -X DELETE http://localhost:5000/api/students/STU-A1B2C3D4
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "message": "Student deleted successfully",
    "data": {
      "_id": "6716fd90e123456789abcdef",
      "studentId": "STU-A1B2C3D4",
      "fullName": "Jane Smith",
      "email": "jane.doe@example.com",
      "course": "Software Engineering",
      "age": 22
    }
  }
  ```

---

## Error Handling & Status Codes

All errors return a consistent JSON response:

```json
{
  "status": "fail" | "error",
  "message": "Descriptive explanation of the error"
}
```

### Standard HTTP Status Codes

| Code | Label | Meaning & Scenarios |
| :---: | :--- | :--- |
| **`200`** | OK | Request succeeded (GET, PUT, DELETE). |
| **`201`** | Created | New student successfully created (POST). |
| **`400`** | Bad Request | Missing required fields, invalid email format, age out of range (< 1 or > 120), empty update payload, or malformed ID format. |
| **`404`** | Not Found | Route does not exist, or valid-format `studentId`/`_id` not found in database. |
| **`409`** | Conflict | Duplicate email address (email already registered to another student). |
| **`500`** | Internal Server Error | Unhandled server or database exceptions. |

---

## Testing

An end-to-end automated test runner is included. It provisions an actual MongoDB Database server instance to validate all 5 endpoints, constraint logic, and error handlers:

```bash
npm test
```

### Test Coverage Summary:
- ✅ Student creation with auto-generated ID
- ✅ Rejection on missing required fields
- ✅ Rejection on invalid email format
- ✅ Rejection on age boundary violations
- ✅ Duplicate email prevention via MongoDB unique index
- ✅ Fetching all student records
- ✅ Retrieval by `studentId` and `_id`
- ✅ 400 Bad Request on invalid ID formats
- ✅ 404 Not Found on nonexistent student records
- ✅ Updating student fields with re-validation
- ✅ Deleting student records and verifying subsequent queries return 404

---

## Postman Collection

The repository includes a ready-to-use Postman Collection file: `postman_collection.json`.

### How to Import and Run

1. Open **Postman**.
2. Click **Import** (top-left) and select `postman_collection.json` from the repository root.
3. The collection **"Student Management API"** will appear in your workspace.
4. Verify the collection variable `baseUrl` is set to `http://localhost:5000`.
5. **Run the Collection**:
   - Right-click the **Student Management API** collection in the sidebar.
   - Click **Run collection**.
   - Ensure the execution order is:
     1. Health Check
     2. Create Student - Success *(automatically captures `studentId`)*
     3. Create Student - Validation Error (Missing Fields)
     4. Create Student - Validation Error (Invalid Email & Age)
     5. Create Student - Duplicate Email Error
     6. Get All Students
     7. Get Student by ID - Success
     8. Get Student by ID - Nonexistent Student (404)
     9. Get Student by ID - Invalid ID Format (400)
     10. Update Student - Success
     11. Update Student - Validation Error (400)
     12. Update Student - Nonexistent Student (404)
     13. Delete Student - Success
     14. Delete Student - Nonexistent Student (404)
   - Click **Run Student Management API**. All built-in assertions will execute and report test passes.

---

## License

This project is licensed under the ISC License.
