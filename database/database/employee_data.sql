-- ============================================================
-- EMS - Employee & User Seed Data
-- employee_data.sql
-- ============================================================

USE ems_db;

-- ── Employees ────────────────────────────────────────────────
INSERT INTO employees
  (employee_id, first_name, last_name, email, phone, dob, gender, designation,
   employment_type, join_date, status, salary, department_id, created_at)
VALUES
  ('EMS-001','Priya',   'Sharma',   'priya.sharma@ems.com',   '+91 98765 43210','1992-05-15','FEMALE','Senior Software Engineer','FULL_TIME','2023-01-15','ACTIVE',900000.00,  1, NOW()),
  ('EMS-002','Rahul',   'Mehta',    'rahul.mehta@ems.com',    '+91 91234 56789','1988-08-22','MALE',  'Marketing Manager',       'FULL_TIME','2023-03-20','ACTIVE',850000.00,  2, NOW()),
  ('EMS-003','Ananya',  'Reddy',    'ananya.reddy@ems.com',   '+91 87654 32109','1994-11-30','FEMALE','Financial Analyst',       'FULL_TIME','2023-05-01','ACTIVE',780000.00,  3, NOW()),
  ('EMS-004','Vikram',  'Nair',     'vikram.nair@ems.com',    '+91 99887 65432','1985-03-10','MALE',  'Tech Lead',               'FULL_TIME','2022-11-10','ACTIVE',1200000.00, 1, NOW()),
  ('EMS-005','Sneha',   'Kapoor',   'sneha.kapoor@ems.com',   '+91 76543 21098','1990-07-18','FEMALE','HR Specialist',           'FULL_TIME','2024-01-08','ACTIVE',720000.00,  4, NOW()),
  ('EMS-006','Arjun',   'Kumar',    'arjun.kumar@ems.com',    '+91 65432 10987','1991-12-05','MALE',  'Sales Executive',         'FULL_TIME','2023-08-14','INACTIVE',650000.00,5, NOW()),
  ('EMS-007','Divya',   'Singh',    'divya.singh@ems.com',    '+91 54321 09876','1995-02-28','FEMALE','Frontend Developer',      'FULL_TIME','2024-02-20','ACTIVE',850000.00,  1, NOW()),
  ('EMS-008','Kiran',   'Patel',    'kiran.patel@ems.com',    '+91 43210 98765','1987-09-14','MALE',  'Operations Manager',      'FULL_TIME','2022-07-05','ACTIVE',950000.00,  6, NOW()),
  ('EMS-009','Meera',   'Iyer',     'meera.iyer@ems.com',     '+91 32109 87654','1993-04-22','FEMALE','Senior Accountant',       'FULL_TIME','2023-10-30','ACTIVE',800000.00,  3, NOW()),
  ('EMS-010','Suresh',  'Krishnan', 'suresh.krishnan@ems.com','+91 21098 76543','1989-06-08','MALE',  'Content Strategist',      'FULL_TIME','2024-04-12','ACTIVE',700000.00,  2, NOW()),
  ('EMS-011','Pooja',   'Gupta',    'pooja.gupta@ems.com',    '+91 11234 56789','1996-01-17','FEMALE','Junior Developer',        'FULL_TIME','2025-01-06','ACTIVE',600000.00,  1, NOW()),
  ('EMS-012','Ravi',    'Verma',    'ravi.verma@ems.com',     '+91 99123 45678','1986-10-25','MALE',  'Research Engineer',       'FULL_TIME','2022-04-18','ACTIVE',1100000.00, 11,NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Update managers (EMS-004 manages EMS-001, EMS-007, EMS-011, EMS-012)
UPDATE employees SET manager_id = (SELECT id FROM (SELECT id FROM employees WHERE employee_id='EMS-004') t)
WHERE employee_id IN ('EMS-001','EMS-007','EMS-011');

-- ── Admin User ────────────────────────────────────────────────
-- Password: Admin@123 (BCrypt hashed)
INSERT INTO users (email, password, name, role, enabled, created_at)
VALUES
  ('admin@ems.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCnrXUAFm0cGKzHgCw7a0iy',
   'Admin User', 'ADMIN', TRUE, NOW()),
  ('hr@ems.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCnrXUAFm0cGKzHgCw7a0iy',
   'HR Manager', 'HR_MANAGER', TRUE, NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);
