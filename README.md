# Image Analytics Platform

A full-stack web application for uploading, managing, and analyzing images with authentication, analytics dashboards, and containerized deployment.

---

## Project Overview

The Image Analytics Platform allows authenticated users to:

- Upload images with labels
- View analytics dashboards with charts
- Filter images by date
- Group images by label
- Paginate through uploaded images

**Tech Stack:**

- **Frontend:** React, Vite, Tailwind CSS, Recharts, Axios
- **Backend:** Node.js, Express, MongoDB (Atlas), Mongoose, JWT, Multer
- **DevOps:** Docker, Docker Compose

---

## Setup & Installation

### Prerequisites

- Node.js v18+
- npm v9+
- MongoDB Atlas account (or local MongoDB)
- Docker & Docker Compose (for containerized setup)

### Local Development (Without Docker)

**1. Clone the repository:**

```bash
git clone https://github.com/umar-dev01/image-analytics-platform.git
cd image-analytics-platform
```

**2. Backend setup:**

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder using `.env.example` as reference:

```bash
cp backend/.env.example backend/.env
```

Then fill in your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/image_analytics
JWT_SECRET=xis_super_secret_key_2024
```

Start the backend:

```bash
npm run dev
```

**3. Frontend setup:**

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

**4. Open in browser:** `http://localhost:5173`

---

### Docker Setup

**1. Make sure Docker and Docker Compose are installed.**

**2. Set environment variables in `backend/.env`:**

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/image_analytics
JWT_SECRET=xis_super_secret_key_2024
```

**3. Run the application:**

```bash
docker-compose up --build
```

**4. Access the application:**

- Frontend: `http://localhost:80`
- Backend API: `http://localhost:5000`

**5. Stop the application:**

```bash
docker-compose down
```

---

## System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │ Mongoose│                 │
│  React Frontend │────────▶│  Express Backend│────────▶│  MongoDB Atlas  │
│  (Port 5173)    │◀────────│  (Port 5000)    │◀────────│                 │
│                 │  JSON   │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Request Flow:**

1. User logs in via React frontend
2. Backend validates credentials, returns JWT token
3. Frontend stores token in localStorage
4. All subsequent requests include JWT in Authorization header
5. Backend middleware validates token before processing requests
6. Data is fetched from MongoDB Atlas and returned as JSON
7. React renders analytics charts using Recharts

---

## Database Schema

### User Collection

```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "email": "string (required, unique)",
  "password": "string (hashed with bcryptjs)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Image Collection

```json
{
  "_id": "ObjectId",
  "filename": "string (required) - original file name",
  "url": "string (required) - file path on server",
  "size": "number (required) - file size in bytes",
  "label": "string (required) - category tag",
  "uploadedAt": "Date - upload timestamp",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All image endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

---

### Auth Endpoints

#### Register

```
POST /auth/register
```

**Request Body:**

```json
{
  "name": "Umar Fazal",
  "email": "user@example.com",
  "password": "123456"
}
```

**Response (201):**

```json
{
  "_id": "69f4c7f44883db80e1e4290d",
  "name": "Umar Fazal",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### Login

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**Response (200):**

```json
{
  "_id": "69f4c7f44883db80e1e4290d",
  "name": "Umar Fazal",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Image Endpoints (All Protected)

#### Upload Image

```
POST /images
Content-Type: multipart/form-data
```

**Request Body (form-data):**

- `image` — image file
- `label` — string (e.g. "nature")

**Response (201):**

```json
{
  "_id": "69f4d26f04b14250085c7050",
  "filename": "photo.jpg",
  "url": "/uploads/1777652335740-photo.jpg",
  "size": 933810,
  "label": "nature",
  "uploadedAt": "2026-05-01T16:18:55.760Z"
}
```

---

#### Get All Images (with Pagination + Date Filter)

```
GET /images?page=1&limit=10&date=2026-05-01
```

**Query Parameters:**

- `page` — page number (default: 1)
- `limit` — items per page (default: 10)
- `date` — filter by date (YYYY-MM-DD, optional)

**Response (200):**

```json
{
  "total": 25,
  "page": 1,
  "totalPages": 3,
  "images": [...]
}
```

---

#### Get Total Image Count

```
GET /images/count
```

**Response (200):**

```json
{
  "total": 25
}
```

---

#### Get Images Grouped by Label

```
GET /images/group-by-label
```

**Response (200):**

```json
[
  { "_id": "nature", "count": 10 },
  { "_id": "architecture", "count": 8 }
]
```

---

#### Get Images Per Day

```
GET /images/per-day
```

**Response (200):**

```json
[
  { "_id": "2026-05-01", "count": 5 },
  { "_id": "2026-05-02", "count": 3 }
]
```

---

#### Delete Image

```
DELETE /images/:id
```

**Response (200):**

```json
{
  "message": "Image deleted"
}
```

---

## Design Decisions

### MongoDB over PostgreSQL

Chose MongoDB because image metadata is flexible and schema-less by nature. MongoDB's aggregation pipeline makes grouping by label and date significantly simpler than SQL GROUP BY queries.

### JWT Authentication

Stateless JWT tokens were chosen over sessions because the app is designed to be containerized and horizontally scalable. Sessions would require shared storage between containers.

### MongoDB Atlas

Used MongoDB Atlas instead of a local instance to ensure the app works in any environment including Docker containers without needing a separate MongoDB container.

### Multer for File Uploads

Multer handles multipart/form-data efficiently with disk storage. Files are stored in the `uploads/` directory with timestamped filenames to avoid conflicts.

### React + Vite

Vite provides significantly faster development build times compared to Create React App. Recharts was chosen for analytics charts due to its React-first API and ease of customization.

---

## Assumptions & Limitations

- **Authentication:** Only login and register are implemented. Password reset is out of scope.
- **File Storage:** Images are stored on the local filesystem. In production, this should be replaced with cloud storage (e.g. AWS S3).
- **Single User Analytics:** Analytics show data across all uploads regardless of which user uploaded them.
- **Image Validation:** Basic file type filtering is applied via `accept="image/*"` on the frontend. Backend validation can be extended.
- **Docker:** Due to environment constraints, Docker configuration has been written and tested for correctness. The app runs fully in local development mode.

---

## Git Workflow

This project follows incremental commit discipline:

```
feat: initialize project structure with backend and frontend folders
feat: complete backend with auth, image model, and analytics APIs
feat: complete React dashboard with charts, upload, auth, and pagination
feat: add Dockerfiles and docker-compose for containerization
docs: add complete project documentation
```
