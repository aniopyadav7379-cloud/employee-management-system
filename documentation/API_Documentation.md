# EMS API Documentation

Base URL: `http://localhost:8080/api`

All protected endpoints require the `Authorization: Bearer <token>` header.

---

## Authentication

### POST /api/auth/login
Login and receive a JWT token.

**Request Body:**
```json
{ "email": "admin@ems.com", "password": "Admin@123" }
```
**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "userId": 1,
  "name": "Admin User",
  "email": "admin@ems.com",
  "role": "ADMIN"
}
```

### GET /api/auth/me *(Protected)*
Returns current logged-in user info.

### POST /api/auth/change-password *(Protected)*
```json
{ "currentPassword": "...", "newPassword": "..." }
```

---

## Employees

### GET /api/employees
Query params: `q`, `status` (ACTIVE|INACTIVE), `departmentId`, `page`, `size`, `sortBy`

### GET /api/employees/{id}
### GET /api/employees/recent — Last 8 joined
### GET /api/employees/stats — Headcount statistics
### GET /api/employees/search?q={query}

### POST /api/employees
```json
{
  "employeeId": "EMS-001",
  "firstName": "Priya",
  "lastName": "Sharma",
  "email": "priya@ems.com",
  "phone": "+91 98765 43210",
  "designation": "Software Engineer",
  "joinDate": "2025-06-01",
  "departmentId": 1,
  "status": "ACTIVE",
  "employmentType": "FULL_TIME"
}
```

### PUT /api/employees/{id} — Full update (same body as POST)
### DELETE /api/employees/{id} — Returns 204 No Content

---

## Departments

### GET /api/departments
### GET /api/departments/{id}
### GET /api/departments/stats
### POST /api/departments
```json
{
  "name": "Engineering",
  "head": "Vikram Nair",
  "location": "Hyderabad",
  "description": "Core product development",
  "status": "ACTIVE"
}
```
### PUT /api/departments/{id}
### DELETE /api/departments/{id}

---

## Leave Requests

### GET /api/leaves
### GET /api/leaves/{id}
### GET /api/leaves/stats
### GET /api/leaves/my — Current user's leaves
### GET /api/leaves/balance/{employeeId}

### POST /api/leaves
```json
{
  "employeeId": 1,
  "leaveType": "CASUAL",
  "startDate": "2025-07-01",
  "endDate": "2025-07-03",
  "reason": "Family function"
}
```

### PATCH /api/leaves/{id}/approve
```json
{ "note": "Approved. Enjoy!" }
```

### PATCH /api/leaves/{id}/reject
```json
{ "reason": "Project deadline conflict." }
```

### PATCH /api/leaves/{id}/cancel

---

## Dashboard

### GET /api/dashboard/summary
```json
{
  "totalEmployees": 248,
  "activeEmployees": 238,
  "totalDepartments": 12,
  "pendingLeaves": 3,
  "onLeaveToday": 7
}
```

### GET /api/dashboard/headcount?period=month|year
### GET /api/dashboard/activity

---

## Error Responses

All errors follow this shape:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": { "email": "Enter a valid email address" },
  "timestamp": "2025-06-15T10:30:00"
}
```

| Code | Meaning                   |
|------|---------------------------|
| 400  | Validation / bad input    |
| 401  | Unauthorized / bad token  |
| 403  | Forbidden (role)          |
| 404  | Resource not found        |
| 409  | Conflict (duplicate)      |
| 500  | Internal server error     |
