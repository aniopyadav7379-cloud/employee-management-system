-- ============================================================
-- EMS - Database Schema
-- schema.sql  (MySQL 8.0+)
-- ============================================================

CREATE DATABASE IF NOT EXISTS ems_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ems_db;

-- ── Departments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id          BIGINT         NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)   NOT NULL UNIQUE,
  head        VARCHAR(100),
  location    VARCHAR(100),
  description TEXT,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME(6)    NOT NULL,
  updated_at  DATETIME(6),
  PRIMARY KEY (id),
  INDEX idx_dept_name   (name),
  INDEX idx_dept_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Employees ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id                      BIGINT          NOT NULL AUTO_INCREMENT,
  employee_id             VARCHAR(20)     NOT NULL UNIQUE,
  first_name              VARCHAR(50)     NOT NULL,
  last_name               VARCHAR(50)     NOT NULL,
  email                   VARCHAR(100)    NOT NULL UNIQUE,
  phone                   VARCHAR(20),
  dob                     DATE,
  gender                  ENUM('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'),
  address                 TEXT,
  designation             VARCHAR(100)    NOT NULL,
  employment_type         ENUM('FULL_TIME','PART_TIME','CONTRACT','INTERN') NOT NULL DEFAULT 'FULL_TIME',
  join_date               DATE            NOT NULL,
  status                  ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  salary                  DECIMAL(12,2),
  emergency_contact_name  VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  notes                   TEXT,
  photo_url               VARCHAR(255),
  department_id           BIGINT,
  manager_id              BIGINT,
  created_at              DATETIME(6)     NOT NULL,
  updated_at              DATETIME(6),
  PRIMARY KEY (id),
  INDEX idx_emp_email      (email),
  INDEX idx_emp_status     (status),
  INDEX idx_emp_department (department_id),
  INDEX idx_emp_manager    (manager_id),
  INDEX idx_emp_join_date  (join_date),
  CONSTRAINT fk_emp_dept    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id)    REFERENCES employees(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Users (authentication) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          BIGINT        NOT NULL AUTO_INCREMENT,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  role        ENUM('ADMIN','HR_MANAGER','MANAGER','EMPLOYEE') NOT NULL,
  enabled     BOOLEAN       NOT NULL DEFAULT TRUE,
  employee_id BIGINT,
  created_at  DATETIME(6)   NOT NULL,
  updated_at  DATETIME(6),
  PRIMARY KEY (id),
  INDEX idx_user_email (email),
  INDEX idx_user_role  (role),
  CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Leave Requests ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  employee_id      BIGINT       NOT NULL,
  leave_type       ENUM('CASUAL','SICK','ANNUAL','MATERNITY','PATERNITY','UNPAID') NOT NULL,
  start_date       DATE         NOT NULL,
  end_date         DATE         NOT NULL,
  reason           TEXT         NOT NULL,
  status           ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  approver_note    VARCHAR(500),
  approved_by      BIGINT,
  approved_at      DATETIME(6),
  created_at       DATETIME(6)  NOT NULL,
  updated_at       DATETIME(6),
  PRIMARY KEY (id),
  INDEX idx_leave_employee  (employee_id),
  INDEX idx_leave_status    (status),
  INDEX idx_leave_dates     (start_date, end_date),
  INDEX idx_leave_type      (leave_type),
  CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_approver FOREIGN KEY (approved_by) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
