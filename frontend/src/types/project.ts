// Shared TypeScript interfaces for the Sathyabama Revenue Monitoring Portal

export type ProjectStatus = 'on_going' | 'completed' | 'terminated';

export interface Department {
  id: string;
  name: string;
  description?: string;
  deleted_at?: string | null;
}

export interface ProfileRef {
  name: string;
  email: string;
}

export interface DepartmentRef {
  name: string;
}

export interface Project {
  id: string;
  reference_id: string;
  title: string;
  department_id: string;
  duration_months: number;
  funding_agency: string;
  sanctioned_date: string;
  sanctioned_budget: number | string;
  received_budget: number | string;
  utilized_budget: number | string;
  pi_id: string;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Joined fields
  departments?: DepartmentRef;
  profiles?: ProfileRef;
}

export interface ProjectYear {
  id: string;
  project_id: string;
  year: number;
  fund: number | string;
  remarks?: string;
  sanction_letter?: string | null;
  release_order?: string | null;
  utilization_certificate?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TeamMemberProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  mobile_number?: string | null;
  avatar_url?: string | null;
  departments?: DepartmentRef;
}

export interface TeamMember {
  id: string;
  project_id: string;
  profile_id: string;
  role_on_project: string;
  stipend?: number | null;
  removed_at?: string | null;
  created_at: string;
  profiles?: TeamMemberProfile;
  project_count?: number | string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  type: string;
  description: string;
  amount?: number | null;
  attachment?: string | null;
  created_at: string;
  user_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  created_by: string;
  created_at: string;
  expires_at?: string | null;
  deleted_at?: string | null;
}

export interface ReportRequest {
  id: string;
  user_id: string;
  project_id?: string | null;
  type: string;
  description?: string;
  status: 'requested' | 'processing' | 'completed' | 'failed';
  download_url?: string | null;
  created_at: string;
  updated_at: string;
  project_title?: string;
}

export interface FinancialTransaction {
  id: string;
  project_id: string;
  type: 'received' | 'spent' | 'stipend';
  amount: number | string;
  description?: string;
  created_by: string;
  created_at: string;
}

export interface AddTeamMemberInput {
  email: string;
  role: string;
  stipend?: number;
  department_id?: string;
}

export interface AddAnnouncementInput {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  expires_at?: string;
}

export interface AddReportRequestInput {
  project_id?: string;
  type: string;
  description?: string;
}

export interface AddTransactionInput {
  type: 'received' | 'spent' | 'stipend';
  amount: number;
  description?: string;
}
