-- ============================================================
-- EMS - Department Seed Data
-- department_data.sql
-- ============================================================

USE ems_db;

INSERT INTO departments (name, head, location, description, status, created_at) VALUES
  ('Engineering',   'Vikram Nair',    'Hyderabad', 'Core product development, backend, frontend and DevOps infrastructure.', 'ACTIVE', NOW()),
  ('Marketing',     'Rahul Mehta',    'Mumbai',    'Brand management, digital marketing, content strategy and campaigns.',   'ACTIVE', NOW()),
  ('Finance',       'Meera Iyer',     'Bangalore', 'Accounting, budgeting, financial reporting and compliance.',             'ACTIVE', NOW()),
  ('Human Resources','Sneha Kapoor',  'Hyderabad', 'Talent acquisition, onboarding, employee relations and benefits.',      'ACTIVE', NOW()),
  ('Sales',         'Arjun Kumar',    'Delhi',     'B2B enterprise sales, key account management and revenue growth.',       'ACTIVE', NOW()),
  ('Operations',    'Kiran Patel',    'Pune',      'Supply chain, logistics, vendor management and facilities.',             'ACTIVE', NOW()),
  ('IT',            'Suresh Krishnan','Hyderabad', 'IT infrastructure, security, internal tools and support.',              'ACTIVE', NOW()),
  ('Legal',         'Ananya Reddy',   'Mumbai',    'Corporate legal, contracts, compliance and regulatory affairs.',         'ACTIVE', NOW()),
  ('Product',       'Divya Singh',    'Bangalore', 'Product management, roadmap planning and UX strategy.',                 'ACTIVE', NOW()),
  ('Customer Success','Priya Sharma', 'Hyderabad', 'Client onboarding, support, retention and success management.',         'ACTIVE', NOW()),
  ('Research & Dev','Ravi Verma',     'Bangalore', 'Applied research, innovation and proof-of-concept development.',        'ACTIVE', NOW()),
  ('Administration','Pooja Gupta',    'Hyderabad', 'Office management, executive support and administrative operations.',   'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name);
