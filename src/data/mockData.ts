import { Project, ProjectDocument, TeamMember, Activity, ReportRequest, User, DashboardStats, AgencyStats } from '@/types';

// Mock users
export const mockUsers: User[] = [
  { id: '1', email: 'test@test.com', name: 'Dr. Brijita', role: 'faculty', department: 'CSE' },
  { id: '2', email: 'csehod@test.com', name: 'Dr. Kumar', role: 'hod', department: 'CSE' },
  { id: '3', email: 'dean@test.com', name: 'Dr. Rajan', role: 'dean', department: 'Administration' },
];

// Mock projects
export const mockProjects: Project[] = [
  {
    id: '1',
    referenceId: 'DI232KJ2732',
    title: 'Internal Revenue Tracking Portal',
    department: 'CSE',
    fundingAgency: 'DST',
    sanctionedBudget: 300000,
    receivedBudget: 300000,
    utilizedBudget: 300000,
    duration: '1 Years 2 Months',
    durationMonths: 14,
    status: 'Completed',
    principalInvestigator: 'Dr. Brijita',
    piEmail: 'test@test.com',
    sanctionedDate: '6/12/2022',
    createdAt: '2022-12-06',
  },
  {
    id: '2',
    referenceId: '289323823d',
    title: 'ALS Discriminator',
    department: 'CSE',
    fundingAgency: 'DRDO',
    sanctionedBudget: 100000,
    receivedBudget: 100000,
    utilizedBudget: 100000,
    duration: '1 Year',
    durationMonths: 12,
    status: 'Terminated',
    principalInvestigator: 'Dr. Brijita',
    piEmail: 'test@test.com',
    sanctionedDate: '12/1/2023',
    createdAt: '2023-01-12',
  },
  {
    id: '3',
    referenceId: '23238932',
    title: 'Canteen Management',
    department: 'CSE',
    fundingAgency: 'DST',
    sanctionedBudget: 120000,
    receivedBudget: 120000,
    utilizedBudget: 0,
    duration: '1 Years 2 Months',
    durationMonths: 14,
    status: 'On-Going',
    principalInvestigator: 'Dr. Brijita',
    piEmail: 'test@test.com',
    sanctionedDate: '10/1/2023',
    createdAt: '2023-01-10',
  },
  {
    id: '4',
    referenceId: '23902',
    title: 'Mark Entering System',
    department: 'CSE',
    fundingAgency: 'TUFIDCO',
    sanctionedBudget: 230000,
    receivedBudget: 230000,
    utilizedBudget: 230000,
    duration: '1 Year',
    durationMonths: 12,
    status: 'Completed',
    principalInvestigator: 'Dr. Brijita',
    piEmail: 'test@test.com',
    sanctionedDate: '12/12/2022',
    createdAt: '2022-12-12',
  },
  {
    id: '5',
    referenceId: 'SR/FTP/PS-046/2012',
    title: 'Tunable Block Co-Polymer Photonic gels',
    department: 'CSE',
    fundingAgency: 'DST-SERC',
    sanctionedBudget: 2376000,
    receivedBudget: 1515000,
    utilizedBudget: 530000,
    duration: '3 Years',
    durationMonths: 36,
    status: 'Completed',
    principalInvestigator: 'Dr. Brijita',
    piEmail: 'test@test.com',
    sanctionedDate: '14/12/2014',
    createdAt: '2014-12-14',
  },
];

// Mock documents
export const mockDocuments: ProjectDocument[] = [
  {
    id: '1',
    projectId: '5',
    year: 1,
    releaseOrder: 'release_order_1.pdf',
    sanctionLetter: 'sanction_letter_1.pdf',
    utilizationCertificate: 'utilization_cert_1.pdf',
    fund: 1515000,
    remarks: 'NIL',
  },
  {
    id: '2',
    projectId: '5',
    year: 2,
    releaseOrder: undefined,
    sanctionLetter: undefined,
    utilizationCertificate: undefined,
    fund: 0,
    remarks: 'NIL',
  },
];

// Mock team members
export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    projectId: '5',
    name: 'Dr. Brijita',
    email: 'test@test.com',
    role: 'PI',
    department: 'CSE',
    stipend: 0,
    mobileNumber: '9965662658',
    type: 'investigator',
  },
  {
    id: '2',
    projectId: '5',
    name: 'Nannan',
    email: 'nanna7077@gmail.com',
    role: 'JRF',
    department: 'CSE',
    stipend: 20000,
    mobileNumber: '9445168005',
    type: 'manpower',
  },
];

// Mock activities
export const mockActivities: Activity[] = [
  {
    id: '1',
    projectId: '5',
    type: 'Document Row Created',
    report: 'Document Row for year 2 added by test@test.com.',
    amount: undefined,
    isRecurring: false,
    timestamp: '2023-01-12T12:00:00Z',
    userId: '1',
    attachment: undefined,
  },
  {
    id: '2',
    projectId: '5',
    type: 'Stipend',
    report: 'Released to JRF',
    amount: -480000,
    isRecurring: true,
    timestamp: '2023-01-12T11:53:00Z',
    userId: '1',
    attachment: undefined,
  },
  {
    id: '3',
    projectId: '5',
    type: 'Revenue Received',
    report: 'Project fund released from college',
    amount: 50000,
    isRecurring: false,
    timestamp: '2023-01-12T11:45:00Z',
    userId: '1',
    attachment: undefined,
  },
  {
    id: '4',
    projectId: '5',
    type: 'Revenue Spent',
    report: 'UV Bill',
    amount: -50000,
    isRecurring: true,
    timestamp: '2023-01-12T11:44:00Z',
    userId: '1',
    attachment: undefined,
  },
  {
    id: '5',
    projectId: '5',
    type: 'ManPower Added',
    report: 'ManPower Nannan added by test@test.com',
    amount: undefined,
    isRecurring: false,
    timestamp: '2023-01-12T11:44:00Z',
    userId: '1',
    attachment: undefined,
  },
  {
    id: '6',
    projectId: '5',
    type: 'Document Added',
    report: 'Release Order for year 1 added by test@test.com.',
    amount: undefined,
    isRecurring: false,
    timestamp: '2023-01-12T11:33:00Z',
    userId: '1',
    attachment: undefined,
  },
];

// Mock report requests
export const mockReportRequests: ReportRequest[] = [
  {
    id: '1',
    projectIds: ['1', '2'],
    requestedOn: 'Thu, 12 Jan 2023 11:48:08 GMT',
    status: 'Completed',
    description: 'Document Bundle Generation Request for ProjectIDs 1, 2 with requests for SanctionLetter, Release Order: releaseOrder, Utilization Artifacts: True, Activity Documents: False',
    downloadUrl: '/reports/report_1.zip',
  },
  {
    id: '2',
    projectIds: ['1', '2'],
    requestedOn: 'Wed, 11 Jan 2023 14:47:58 GMT',
    status: 'Completed',
    description: 'Document Bundle Generation Request for ProjectIDs 1, 2 with requests for SanctionLetter, Release Order: , Utilization Artifacts: True, Activity Documents: False',
    downloadUrl: '/reports/report_2.zip',
  },
  {
    id: '3',
    projectIds: ['1'],
    requestedOn: 'Wed, 11 Jan 2023 14:22:12 GMT',
    status: 'Completed',
    description: 'Document Bundle Generation Request for ProjectIDs 1 with requests for SanctionLetter, Release Order: , Utilization Artifacts: True, Activity Documents: False',
    downloadUrl: '/reports/report_3.zip',
  },
  {
    id: '4',
    projectIds: ['1'],
    requestedOn: 'Wed, 11 Jan 2023 11:50:32 GMT',
    status: 'Completed',
    description: 'Document Bundle Generation Request for ProjectIDs 1 with requests for SanctionLetter, Release Order: , Utilization Artifacts: False, Activity Documents: False',
    downloadUrl: '/reports/report_4.zip',
  },
];

// Calculate dashboard stats
export const calculateDashboardStats = (projects: Project[]): DashboardStats => {
  const totalProjects = projects.length;
  const ongoingProjects = projects.filter(p => p.status === 'On-Going').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const terminatedProjects = projects.filter(p => p.status === 'Terminated').length;
  
  const totalSanctioned = projects.reduce((sum, p) => sum + p.sanctionedBudget, 0);
  const totalReceived = projects.reduce((sum, p) => sum + p.receivedBudget, 0);
  const totalUtilized = projects.reduce((sum, p) => sum + p.utilizedBudget, 0);
  const balanceToGet = totalSanctioned - totalReceived;
  const availableBudget = totalReceived - totalUtilized;

  return {
    totalProjects,
    ongoingProjects,
    completedProjects,
    terminatedProjects,
    totalSanctioned,
    totalReceived,
    totalUtilized,
    balanceToGet,
    availableBudget,
  };
};

// Calculate agency stats
export const calculateAgencyStats = (projects: Project[]): AgencyStats[] => {
  const agencies = [...new Set(projects.map(p => p.fundingAgency))];
  
  return agencies.map(agency => {
    const agencyProjects = projects.filter(p => p.fundingAgency === agency);
    return {
      agency: agency as string,
      total: agencyProjects.length,
      completed: agencyProjects.filter(p => p.status === 'Completed').length,
      terminated: agencyProjects.filter(p => p.status === 'Terminated').length,
      ongoing: agencyProjects.filter(p => p.status === 'On-Going').length,
    };
  });
};
