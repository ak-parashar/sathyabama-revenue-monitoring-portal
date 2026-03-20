
-- Allow JRF, assistant, co_pi to update projects they're part of
DROP POLICY IF EXISTS "PI+ can update projects" ON public.projects;
CREATE POLICY "Team members can update projects" ON public.projects
FOR UPDATE TO authenticated
USING (
  deleted_at IS NULL AND (
    get_user_role() = 'superadmin'
    OR (get_user_role() = 'admin' AND department_id = get_user_department_id())
    OR is_user_in_project(id)
  )
);

-- Allow JRF, assistant, co_pi to manage project years
DROP POLICY IF EXISTS "PI+ can manage project years" ON public.project_years;
CREATE POLICY "Team members can manage project years" ON public.project_years
FOR INSERT TO authenticated
WITH CHECK (has_project_access(project_id) AND is_user_in_project(project_id));

DROP POLICY IF EXISTS "PI+ can update project years" ON public.project_years;
CREATE POLICY "Team members can update project years" ON public.project_years
FOR UPDATE TO authenticated
USING (deleted_at IS NULL AND has_project_access(project_id) AND is_user_in_project(project_id));
