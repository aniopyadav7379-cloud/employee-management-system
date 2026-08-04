# EMSPro — Employee Management System

A full-stack Employee Management System built with **Spring Boot 3** (backend) and **Vanilla JS / HTML5** (frontend), featuring JWT authentication, a dark navy/indigo/cyan design system, and complete CRUD for employees, departments and leave management.

---

## Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | HTML5, CSS3 (custom design system), Vanilla JS, Chart.js |
| Backend    | Java 17, Spring Boot 3.2, Spring Security, JPA/Hibernate |
| Auth       | JWT (jjwt 0.12.5), BCrypt password hashing          |
| Database   | MySQL 8.0                                           |
| Build      | Maven 3.9                                           |

---

## Project Structure

```
ems-project/
├── frontend/           # Static HTML/CSS/JS SPA
│   ├── index.html      # Login page
│   ├── dashboard.html
│   ├── employees.html
│   ├── add-employee.html
│   ├── edit-employee.html
│   ├── departments.html
│   ├── leave-management.html
│   ├── profile.html
│   ├── css/
│   │   ├── style.css       # Global design system
│   │   ├── login.css
│   │   ├── dashboard.css
│   │   └── employee.css
│   └── js/
│       ├── api.js          # Centralized API client
│       ├── login.js
│       ├── dashboard.js
│       ├── employee.js
│       ├── department.js
│       ├── leave.js
│       └── profile.js
├── backend/            # Spring Boot API
│   ├── pom.xml
│   └── src/main/java/com/ems/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── entity/
│       ├── dto/
│       ├── config/     # Security, JWT, CORS
│       ├── exception/
│       ├── mapper/
│       └── util/
└── database/
    ├── schema.sql
    ├── department_data.sql
    ├── employee_data.sql
    └── leave_data.sql
```

---

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.9+
- MySQL 8.0+
- Any modern browser

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p ems_db < database/department_data.sql
mysql -u root -p ems_db < database/employee_data.sql
mysql -u root -p ems_db < database/leave_data.sql
```

### 2. Backend Setup
```bash
cd backend

# Edit DB credentials in:
# src/main/resources/application.properties

mvn clean install
mvn spring-boot:run
```
Backend runs at: `http://localhost:8080`

### 3. Frontend Setup
Open `frontend/index.html` in your browser, or serve with any static file server:
```bash
# Using Python
cd frontend
python3 -m http.server 5500

# Using Node.js (npx)
npx serve frontend -p 5500
```
Frontend runs at: `http://localhost:5500`

---

## Demo Credentials

| Role        | Email           | Password   |
|-------------|-----------------|------------|
| Admin       | admin@ems.com   | Admin@123  |
| HR Manager  | hr@ems.com      | Admin@123  |

---

## API Base URL
All API calls: `http://localhost:8080/api`

### Key Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | /api/auth/login                 | Login, returns JWT       |
| GET    | /api/auth/me                    | Current user info        |
| GET    | /api/employees                  | List all employees       |
| POST   | /api/employees                  | Create employee          |
| PUT    | /api/employees/{id}             | Update employee          |
| DELETE | /api/employees/{id}             | Delete employee          |
| GET    | /api/departments                | List all departments     |
| POST   | /api/departments                | Create department        |
| GET    | /api/leaves                     | All leave requests       |
| POST   | /api/leaves                     | Submit leave request     |
| PATCH  | /api/leaves/{id}/approve        | Approve leave            |
| PATCH  | /api/leaves/{id}/reject         | Reject leave             |
| GET    | /api/dashboard/summary          | Dashboard stats          |

---

## Features

- **JWT Authentication** — Secure login with role-based access (Admin, HR Manager, Manager, Employee)
- **Employee Management** — Full CRUD with search, filter, pagination, CSV export, table & card views
- **Department Management** — Create/edit departments with employee counts and visual cards
- **Leave Management** — Apply, approve, reject with leave balance tracking per employee
- **Dashboard** — Real-time stats, headcount trend chart (Chart.js), department donut chart, activity feed
- **Profile** — View/edit personal info, change password with strength validation
- **Responsive** — Mobile-friendly layout with collapsible sidebar
- **Dark Theme** — Navy/indigo/cyan design system with CSS custom properties

---

## Environment Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/ems_db
spring.datasource.username=YOUR_DB_USER
spring.datasource.password=YOUR_DB_PASSWORD

# JWT Secret (replace with a strong Base64-encoded 256-bit key in production)
app.jwt.secret=YOUR_SECRET_KEY
app.jwt.expiration-ms=86400000   # 24 hours
```

---

## License
MIT © 2025 EMSPro
