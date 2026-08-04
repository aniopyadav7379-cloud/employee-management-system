-- ============================================================
-- EMS - Leave Request Seed Data
-- leave_data.sql
-- ============================================================

USE ems_db;

INSERT INTO leave_requests
  (employee_id, leave_type, start_date, end_date, reason, status, created_at)
VALUES
  -- Pending
  ((SELECT id FROM employees WHERE employee_id='EMS-002'), 'CASUAL',  '2025-07-01','2025-07-03','Family function attendance.','PENDING', NOW()),
  ((SELECT id FROM employees WHERE employee_id='EMS-005'), 'SICK',    '2025-06-28','2025-06-30','Fever and cold, doctor advised rest.','PENDING', NOW()),
  ((SELECT id FROM employees WHERE employee_id='EMS-006'), 'ANNUAL',  '2025-07-10','2025-07-18','Annual family vacation.','PENDING', NOW()),
  -- Approved
  ((SELECT id FROM employees WHERE employee_id='EMS-001'), 'CASUAL',  '2025-06-20','2025-06-21','Personal work.','APPROVED', DATE_SUB(NOW(), INTERVAL 7 DAY)),
  ((SELECT id FROM employees WHERE employee_id='EMS-007'), 'SICK',    '2025-06-15','2025-06-16','Not feeling well.','APPROVED', DATE_SUB(NOW(), INTERVAL 12 DAY)),
  ((SELECT id FROM employees WHERE employee_id='EMS-009'), 'CASUAL',  '2025-05-22','2025-05-23','Festival holiday.','APPROVED', DATE_SUB(NOW(), INTERVAL 25 DAY)),
  -- Rejected
  ((SELECT id FROM employees WHERE employee_id='EMS-008'), 'UNPAID',  '2025-06-10','2025-06-12','Personal reasons.','REJECTED', DATE_SUB(NOW(), INTERVAL 15 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Set rejection reason for rejected leaves
UPDATE leave_requests
SET rejection_reason = 'Insufficient leave balance and critical project deadline.'
WHERE status = 'REJECTED'
  AND employee_id = (SELECT id FROM employees WHERE employee_id='EMS-008');
