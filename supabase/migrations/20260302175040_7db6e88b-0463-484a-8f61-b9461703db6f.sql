
-- =============================================
-- SATHYABAMA REVENUE MONITORING PORTAL - FULL SCHEMA
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'pi', 'co_pi', 'assistant', 'jrf', 'student');
CREATE TYPE public.project_status AS ENUM ('on_going', 'completed', 'terminated');
CREATE TYPE public.transaction_type AS ENUM ('received', 'spent', 'stipend');
CREATE TYPE public.report_status AS ENUM ('requested', 'processing', 'completed', 'failed');
CREATE TYPE public.activity_type AS ENUM (
  'project_created', 'revenue_received', 'revenue_spent', 'stipend_released',
  'document_uploaded', 'manpower_added', 'user_created', 'report_requested',
  'project_updated', 'team_member_added', 'team_member_removed'
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'student',
  department_id UUID REFERENCES public.departments(id),
  mobile_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 4. PROJECTS TABLE
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  funding_agency TEXT NOT NULL,
  sanctioned_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  received_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  utilized_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  duration_months INTEGER NOT NULL DEFAULT 12,
  sanctioned_date DATE,
  status public.project_status NOT NULL DEFAULT 'on_going',
  pi_id UUID NOT NULL REFERENCES public.profiles(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 5. PROJECT YEARS (Documents)
CREATE TABLE public.project_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
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
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 7. TEAM MEMBERS
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  role_on_project TEXT NOT NULL,
  stipend NUMERIC(10,2) DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at TIMESTAMPTZ,
  UNIQUE(project_id, profile_id)
);

-- 8. ACTIVITY LOGS (IMMUTABLE)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  user_id UUID REFERENCES auth.users(id),
  type public.activity_type NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2),
  attachment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. REPORT REQUESTS
CREATE TABLE public.report_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  status public.report_status NOT NULL DEFAULT 'requested',
  description TEXT,
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 10. INDEXES
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_department ON public.profiles(department_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_projects_department ON public.projects(department_id);
CREATE INDEX idx_projects_pi ON public.projects(pi_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_financial_tx_project ON public.financial_transactions(project_id);
CREATE INDEX idx_financial_tx_type ON public.financial_transactions(type);
CREATE INDEX idx_activity_logs_project ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(type);
CREATE INDEX idx_team_members_project ON public.team_members(project_id);
CREATE INDEX idx_team_members_profile ON public.team_members(profile_id);
CREATE INDEX idx_project_years_project ON public.project_years(project_id);

-- 11. HELPER FUNCTIONS (SECURITY DEFINER)

-- Get current user's profile
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;

-- Get current user's department
CREATE OR REPLACE FUNCTION public.get_user_department_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department_id FROM public.profiles WHERE user_id = auth.uid() AND deleted_at IS NULL LIMIT 1;
$$;

-- Check if user is PI of a project
CREATE OR REPLACE FUNCTION public.is_user_pi_of_project(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.profiles pr ON p.pi_id = pr.id
    WHERE p.id = _project_id AND pr.user_id = auth.uid() AND p.deleted_at IS NULL
  );
$$;

-- Check if user is a team member of a project
CREATE OR REPLACE FUNCTION public.is_user_in_project(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.profiles pr ON tm.profile_id = pr.id
    WHERE tm.project_id = _project_id AND pr.user_id = auth.uid() AND tm.removed_at IS NULL
  )
  OR public.is_user_pi_of_project(_project_id);
$$;

-- Check if user has project access (role-based)
CREATE OR REPLACE FUNCTION public.has_project_access(_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.get_user_role() = 'superadmin'
    OR (public.get_user_role() = 'admin' AND EXISTS (
      SELECT 1 FROM public.projects WHERE id = _project_id AND department_id = public.get_user_department_id() AND deleted_at IS NULL
    ))
    OR public.is_user_in_project(_project_id);
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Activity log trigger for financial transactions
CREATE OR REPLACE FUNCTION public.log_financial_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_logs (project_id, user_id, type, description, amount)
  VALUES (
    NEW.project_id,
    NEW.created_by,
    CASE NEW.type
      WHEN 'received' THEN 'revenue_received'::public.activity_type
      WHEN 'spent' THEN 'revenue_spent'::public.activity_type
      WHEN 'stipend' THEN 'stipend_released'::public.activity_type
    END,
    COALESCE(NEW.description, NEW.type::text || ' transaction'),
    NEW.amount
  );
  
  -- Update project budgets
  IF NEW.type = 'received' THEN
    UPDATE public.projects SET received_budget = received_budget + NEW.amount WHERE id = NEW.project_id;
  ELSIF NEW.type IN ('spent', 'stipend') THEN
    UPDATE public.projects SET utilized_budget = utilized_budget + NEW.amount WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. TRIGGERS
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_years_updated_at BEFORE UPDATE ON public.project_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_tx_updated_at BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_report_requests_updated_at BEFORE UPDATE ON public.report_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER log_financial_transaction_trigger
  AFTER INSERT ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_financial_transaction();

-- Prevent updates/deletes on activity_logs
CREATE OR REPLACE FUNCTION public.prevent_activity_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Activity logs are immutable and cannot be modified or deleted';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_activity_log_update
  BEFORE UPDATE OR DELETE ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_activity_log_modification();

-- 13. ENABLE RLS ON ALL TABLES
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;

-- 14. RLS POLICIES

-- DEPARTMENTS
CREATE POLICY "Anyone authenticated can read departments"
  ON public.departments FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "SuperAdmin can insert departments"
  ON public.departments FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'superadmin');

CREATE POLICY "SuperAdmin can update departments"
  ON public.departments FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'superadmin');

-- PROFILES
CREATE POLICY "Users can read relevant profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      user_id = auth.uid()
      OR public.get_user_role() = 'superadmin'
      OR (public.get_user_role() = 'admin' AND department_id = public.get_user_department_id())
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- PROJECTS
CREATE POLICY "Users can read accessible projects"
  ON public.projects FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      public.get_user_role() = 'superadmin'
      OR (public.get_user_role() = 'admin' AND department_id = public.get_user_department_id())
      OR public.is_user_in_project(id)
    )
  );

CREATE POLICY "PI+ can create projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('superadmin', 'admin', 'pi')
  );

CREATE POLICY "PI+ can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL AND (
      public.get_user_role() = 'superadmin'
      OR (public.get_user_role() = 'admin' AND department_id = public.get_user_department_id())
      OR public.is_user_pi_of_project(id)
    )
  );

-- PROJECT YEARS
CREATE POLICY "Users can read accessible project years"
  ON public.project_years FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.has_project_access(project_id));

CREATE POLICY "PI+ can manage project years"
  ON public.project_years FOR INSERT TO authenticated
  WITH CHECK (public.has_project_access(project_id) AND public.get_user_role() IN ('superadmin', 'admin', 'pi'));

CREATE POLICY "PI+ can update project years"
  ON public.project_years FOR UPDATE TO authenticated
  USING (deleted_at IS NULL AND public.has_project_access(project_id) AND public.get_user_role() IN ('superadmin', 'admin', 'pi'));

-- FINANCIAL TRANSACTIONS
CREATE POLICY "Users can read accessible transactions"
  ON public.financial_transactions FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND public.has_project_access(project_id));

CREATE POLICY "PI+ can create transactions"
  ON public.financial_transactions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_project_access(project_id) AND public.get_user_role() IN ('superadmin', 'admin', 'pi')
  );

-- ACTIVITY LOGS
CREATE POLICY "Users can read accessible activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'superadmin'
    OR (project_id IS NOT NULL AND public.has_project_access(project_id))
  );

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- TEAM MEMBERS
CREATE POLICY "Users can read accessible team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    removed_at IS NULL AND public.has_project_access(project_id)
  );

CREATE POLICY "PI+ can manage team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('superadmin', 'admin', 'pi') AND public.has_project_access(project_id)
  );

CREATE POLICY "PI+ can update team members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (
    public.get_user_role() IN ('superadmin', 'admin', 'pi') AND public.has_project_access(project_id)
  );

-- REPORT REQUESTS
CREATE POLICY "Users can read own report requests"
  ON public.report_requests FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      requested_by = auth.uid()
      OR public.get_user_role() IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Authenticated users can create report requests"
  ON public.report_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND public.has_project_access(project_id));

CREATE POLICY "Users can update own report requests"
  ON public.report_requests FOR UPDATE TO authenticated
  USING (
    deleted_at IS NULL AND (
      requested_by = auth.uid()
      OR public.get_user_role() IN ('superadmin', 'admin')
    )
  );

-- 15. STORAGE BUCKET FOR DOCUMENTS
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- 16. SEED DEPARTMENTS
INSERT INTO public.departments (name, description) VALUES
  ('CSE', 'Computer Science and Engineering'),
  ('ECE', 'Electronics and Communication Engineering'),
  ('EEE', 'Electrical and Electronics Engineering'),
  ('MECH', 'Mechanical Engineering'),
  ('CIVIL', 'Civil Engineering'),
  ('IT', 'Information Technology'),
  ('AIDS', 'Artificial Intelligence and Data Science'),
  ('BIOTECH', 'Biotechnology'),
  ('CHEMICAL', 'Chemical Engineering'),
  ('MBA', 'Master of Business Administration');

-- 17. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
