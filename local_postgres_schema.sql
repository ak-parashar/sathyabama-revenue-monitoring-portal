-- SATHYABAMA REVENUE MONITORING PORTAL - PostgreSQL SCHEMA (Local)

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('superadmin', 'admin', 'pi', 'co_pi', 'assistant', 'jrf', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('on_going', 'completed', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('received', 'spent', 'stipend');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('requested', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
      'project_created', 'revenue_received', 'revenue_spent', 'stipend_released',
      'document_uploaded', 'manpower_added', 'user_created', 'report_requested',
      'project_updated', 'team_member_added', 'team_member_removed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3. PROFILES TABLE
-- Note: Replaced auth.users reference with local login logic
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Added for local auth
  role app_role NOT NULL DEFAULT 'student',
  department_id UUID REFERENCES departments(id),
  mobile_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  funding_agency TEXT NOT NULL,
  sanctioned_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  received_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  utilized_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 12,
  sanctioned_date DATE,
  status project_status NOT NULL DEFAULT 'on_going',
  pi_id UUID NOT NULL REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 5. PROJECT YEARS (Documents)
CREATE TABLE IF NOT EXISTS project_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  release_order TEXT,
  sanction_letter TEXT,
  utilization_certificate TEXT,
  fund NUMERIC(15,2) NOT NULL DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(project_id, year)
);

-- 6. FINANCIAL TRANSACTIONS
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 7. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),
  role_on_project TEXT NOT NULL,
  stipend NUMERIC(10,2) DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at TIMESTAMPTZ,
  UNIQUE(project_id, profile_id)
);

-- 8. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES profiles(id),
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2),
  attachment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'important'
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- 10. REPORT REQUESTS
CREATE TABLE IF NOT EXISTS report_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual', 'summary'
  description TEXT,
  status report_status NOT NULL DEFAULT 'requested',
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 11. SEED DATA
INSERT INTO departments (name, description) VALUES
  ('CSE', 'Computer Science and Engineering'),
  ('ECE', 'Electronics and Communication Engineering'),
  ('EEE', 'Electrical and Electronics Engineering'),
  ('MECH', 'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering'),
  ('IT', 'Information Technology'),
  ('AIDS', 'Artificial Intelligence and Data Science'),
  ('BIOTECH', 'Biotechnology'),
  ('CHEMICAL', 'Chemical Engineering'),
  ('MBA', 'Master of Business Administration')
ON CONFLICT (name) DO NOTHING;

-- ANNOUNCEMENTS SEED
INSERT INTO announcements (title, content, type) VALUES
  ('Welcome to Sathyabama Grants Hub', 'This is the new portal for managing research grants and projects.', 'info'),
  ('Monthly Report Deadline', 'Please submit your monthly project updates by the 25th of every month.', 'important')
ON CONFLICT DO NOTHING;

-- 10. DEFAULT ADMIN USER
-- Password is 'admin123'
INSERT INTO profiles (name, email, password, role)
VALUES ('Admin', 'admin@example.com', '$2a$10$gkbgOhdCIWb74ek9j6RqGOIdwFN9xHuP5d85lHx3O9CsfROyVw55y', 'superadmin')
ON CONFLICT (email) DO NOTHING;
