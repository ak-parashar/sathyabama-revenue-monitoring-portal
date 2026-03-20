// User roles
export type UserRole = 'faculty' | 'hod' | 'dean';

// Project status
export type ProjectStatus = 'On-Going' | 'Completed' | 'Terminated';

// Funding agencies
export type FundingAgency = 'DST' | 'DRDO' | 'SERB' | 'TUFIDCO' | 'DST-SERC' | 'AICTE' | 'UGC' | 'CSIR' | 'DBT';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

// Project interface
export interface Project {
  id: string;
  referenceId: string;
  title: string;
  department: string;
  fundingAgency: FundingAgency | string;
  sanctionedBudget: number;
  receivedBudget: number;
  utilizedBudget: number;
  duration: string;
  durationMonths: number;
  status: ProjectStatus;
  principalInvestigator: string;
  piEmail: string;
  sanctionedDate: string;
  createdAt: string;
}

// Document types
export type DocumentType = 'Release Order' | 'Sanction Letter' | 'Utilization Certificate';

// Project document
export interface ProjectDocument {
  id: string;
  projectId: string;
  year: number;
  releaseOrder?: string;
  sanctionLetter?: string;
  utilizationCertificate?: string;
  fund: number;
  remarks: string;
}

// Team member roles
export type TeamMemberRole = 'PI' | 'Co-PI' | 'JRF' | 'SRF' | 'RA' | 'Staff';

// Team member
export interface TeamMember {
  id: string;
  projectId: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  department: string;
  stipend: number;
  mobileNumber: string;
  type: 'investigator' | 'manpower';
}

// Activity types
export type ActivityType = 
  | 'Project Created'
  | 'Revenue Received'
  | 'Revenue Spent'
  | 'Stipend'
  | 'Document Added'
  | 'Document Row Created'
  | 'ManPower Added'
  | 'Team Member Added';

// Activity log
export interface Activity {
  id: string;
  projectId: string;
  type: ActivityType;
  report: string;
  amount?: number;
  isRecurring: boolean;
  timestamp: string;
  userId: string;
  attachment?: string;
}

// Report request
export interface ReportRequest {
  id: string;
  projectIds: string[];
  requestedOn: string;
  status: 'Requested' | 'Processing' | 'Completed' | 'Failed';
  description: string;
  downloadUrl?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalProjects: number;
  ongoingProjects: number;
  completedProjects: number;
  terminatedProjects: number;
  totalSanctioned: number;
  totalReceived: number;
  totalUtilized: number;
  balanceToGet: number;
  availableBudget: number;
}

// Agency stats for charts
export interface AgencyStats {
  agency: string;
  total: number;
  completed: number;
  terminated: number;
  ongoing: number;
}
