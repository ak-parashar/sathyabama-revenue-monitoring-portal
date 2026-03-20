
-- Allow JRF and Assistant to create projects
DROP POLICY IF EXISTS "PI+ can create projects" ON public.projects;
CREATE POLICY "Anyone with relevant role can create projects" ON public.projects
FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role() IN ('superadmin', 'admin', 'pi', 'assistant', 'jrf')
);

-- Allow JRF and Assistant to add team members (needed during project creation)
DROP POLICY IF EXISTS "PI+ can manage team members" ON public.team_members;
CREATE POLICY "Anyone with relevant role can manage team members" ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (
  public.get_user_role() IN ('superadmin', 'admin', 'pi', 'assistant', 'jrf') 
  AND public.has_project_access(project_id)
);
