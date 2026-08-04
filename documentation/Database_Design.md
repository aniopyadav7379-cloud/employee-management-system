# EMS — Database Design

## Overview

The EMS database uses **MySQL 8.0** with InnoDB engine for full ACID compliance and foreign key support. The schema is normalized to 3NF with strategic denormalization only for read-heavy reporting queries.

---

## Tables

### `departments`
| Column      | Type                        | Constraints               | Description              |
|-------------|-----------------------------|---------------------------|--------------------------|
| id          | BIGINT                      | PK, AUTO_INCREMENT        | Surrogate primary key    |
| name        | VARCHAR(100)                | NOT NULL, UNIQUE          | Department name          |
| head        | VARCHAR(100)                | NULLABLE                  | Department head name     |
| location    | VARCHAR(100)                | NULLABLE                  | Office location          |
| description | TEXT                        | NULLABLE                  | Dept description         |
| status      | ENUM('ACTIVE','INACTIVE')   | NOT NULL, DEFAULT 'ACTIVE'| Active/Inactive flag     |
| created_at  | DATETIME(6)                 | NOT NULL                  | Audit timestamp          |
| updated_at  | DATETIME(6)                 | NULLABLE                  | Audit timestamp          |

**Indexes:** `idx_dept_name`, `idx_dept_status`

---

### `employees`
| Column                  | Type                                              | Constraints               | Description                  |
|-------------------------|---------------------------------------------------|---------------------------|------------------------------|
| id                      | BIGINT                                            | PK, AUTO_INCREMENT        | Surrogate PK                 |
| employee_id             | VARCHAR(20)                                       | NOT NULL, UNIQUE          | Human-readable ID (EMS-001)  |
| first_name              | VARCHAR(50)                                       | NOT NULL                  | First name                   |
| last_name               | VARCHAR(50)                                       | NOT NULL                  | Last name                    |
| email                   | VARCHAR(100)                                      | NOT NULL, UNIQUE          | Work email                   |
| phone                   | VARCHAR(20)                                       | NULLABLE                  | Contact phone                |
| dob                     | DATE                                              | NULLABLE                  | Date of birth                |
| gender                  | ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY') | NULLABLE                  | Gender                       |
| address                 | TEXT                                              | NULLABLE                  | Residential address          |
| designation             | VARCHAR(100)                                      | NOT NULL                  | Job title                    |
| employment_type         | ENUM('FULL_TIME','PART_TIME','CONTRACT','INTERN') | NOT NULL                  | Employment category          |
| join_date               | DATE                                              | NOT NULL                  | Date of joining              |
| status                  | ENUM('ACTIVE','INACTIVE')                         | NOT NULL                  | Employment status            |
| salary                  | DECIMAL(12,2)                                     | NULLABLE                  | Annual salary (INR)          |
| emergency_contact_name  | VARCHAR(100)                                      | NULLABLE                  | Emergency contact name       |
| emergency_contact_phone | VARCHAR(20)                                       | NULLABLE                  | Emergency contact phone      |
| notes                   | TEXT                                              | NULLABLE                  | Additional notes             |
| photo_url               | VARCHAR(255)                                      | NULLABLE                  | Profile photo URL            |
| department_id           | BIGINT                                            | FK → departments(id)      | Department foreign key       |
| manager_id              | BIGINT                                            | FK → employees(id)        | Self-referential manager FK  |
| created_at              | DATETIME(6)                                       | NOT NULL                  | Audit timestamp              |
| updated_at              | DATETIME(6)                                       | NULLABLE                  | Audit timestamp              |

**Indexes:** `idx_emp_email`, `idx_emp_status`, `idx_emp_department`, `idx_emp_manager`, `idx_emp_join_date`

**Self-referential relationship:** The `manager_id` column points to another row in the same table, enabling an org-chart / reporting hierarchy. Set to NULL on delete.

---

### `users`
| Column      | Type                                           | Constraints              | Description                 |
|-------------|------------------------------------------------|--------------------------|-----------------------------|
| id          | BIGINT                                         | PK, AUTO_INCREMENT       | Surrogate PK                |
| email       | VARCHAR(100)                                   | NOT NULL, UNIQUE         | Login email                 |
| password    | VARCHAR(255)                                   | NOT NULL                 | BCrypt-hashed password      |
| name        | VARCHAR(100)                                   | NOT NULL                 | Display name                |
| role        | ENUM('ADMIN','HR_MANAGER','MANAGER','EMPLOYEE')| NOT NULL                 | Access role                 |
| enabled     | BOOLEAN                                        | NOT NULL, DEFAULT TRUE   | Account enabled flag        |
| employee_id | BIGINT                                         | FK → employees(id)       | Linked employee record      |
| created_at  | DATETIME(6)                                    | NOT NULL                 | Audit timestamp             |
| updated_at  | DATETIME(6)                                    | NULLABLE                 | Audit timestamp             |

**Indexes:** `idx_user_email`, `idx_user_role`

**Note:** A user account is separate from the employee record to support admin users who are not employees.

---

### `leave_requests`
| Column           | Type                                                    | Constraints              | Description                |
|------------------|---------------------------------------------------------|--------------------------|----------------------------|
| id               | BIGINT                                                  | PK, AUTO_INCREMENT       | Surrogate PK               |
| employee_id      | BIGINT                                                  | FK → employees(id)       | Leave requester            |
| leave_type       | ENUM('CASUAL','SICK','ANNUAL','MATERNITY','PATERNITY','UNPAID') | NOT NULL        | Type of leave              |
| start_date       | DATE                                                    | NOT NULL                 | Leave start date           |
| end_date         | DATE                                                    | NOT NULL                 | Leave end date             |
| reason           | TEXT                                                    | NOT NULL                 | Reason for leave           |
| status           | ENUM('PENDING','APPROVED','REJECTED','CANCELLED')       | NOT NULL                 | Current status             |
| rejection_reason | TEXT                                                    | NULLABLE                 | Reason if rejected         |
| approver_note    | VARCHAR(500)                                            | NULLABLE                 | Approver comment           |
| approved_by      | BIGINT                                                  | FK → users(id)           | Approver user ID           |
| approved_at      | DATETIME(6)                                             | NULLABLE                 | Approval/rejection time    |
| created_at       | DATETIME(6)                                             | NOT NULL                 | Application timestamp      |
| updated_at       | DATETIME(6)                                             | NULLABLE                 | Audit timestamp            |

**Indexes:** `idx_leave_employee`, `idx_leave_status`, `idx_leave_dates`, `idx_leave_type`

---

## Entity Relationships

```
departments 1──────────────────* employees
                                    │
employees   1──────────────────* employees    (manager → subordinates)
                                    │
employees   1──────────────────* leave_requests
                                    │
users       1──────────────────* leave_requests  (approved_by)
                                    │
users       *──────────────────1 employees    (optional link)
```

### Relationship Summary
| Relationship              | Cardinality | Notes                                      |
|---------------------------|-------------|--------------------------------------------|
| Department → Employees    | One-to-Many | An employee belongs to one department      |
| Employee → Manager        | Many-to-One | Self-referential, nullable                 |
| Employee → LeaveRequests  | One-to-Many | Cascade delete on employee removal         |
| User → LeaveApprovals     | One-to-Many | Tracks who approved/rejected               |

---

## Leave Quota (Annual)

| Leave Type | Days/Year |
|------------|-----------|
| Casual     | 10        |
| Sick       | 10        |
| Annual     | 20        |
| Maternity  | 180       |
| Paternity  | 15        |
| Unpaid     | 30        |

---

## Design Decisions

1. **Soft status flags** — Employees and departments use `status` ENUM instead of hard deletion to preserve historical data and audit trails.
2. **Self-referential manager** — Enables unlimited hierarchy depth without a separate manager table.
3. **Separate users table** — Decouples authentication from HR records; admins can exist without employee records.
4. **DATETIME(6)** — Microsecond precision for audit timestamps across all tables.
5. **SET NULL on delete** — Department/manager foreign keys set to NULL on deletion to prevent orphan records.
6. **CASCADE on leave** — Leave requests are cascaded on employee deletion since they have no meaning without the employee.
7. **BCrypt(12)** — Higher cost factor than default (10) for stronger password security at modest performance cost.
